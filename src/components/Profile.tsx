import { useState, useEffect } from 'react';
import { useToast } from './ToastContainer';
import { api } from '../api';
import { User, UpdateProfileRequest, Address } from '../api/types';
import { Skeleton, SkeletonProfile } from './Skeleton';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Edit2, 
  Save, 
  X, 
  Upload, 
  Navigation,
  UserCheck,
  Calendar,
  Building
} from 'lucide-react';

interface ProfileProps {
  userData?: any;
  onProfileUpdate?: (updatedData: User) => void;
}

export default function Profile({ userData: initialUserData, onProfileUpdate }: ProfileProps) {
  const { showSuccess, showError } = useToast();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [editData, setEditData] = useState({
    name: '',
    contactNumber: '',
    studentLevel: '',
    addresses: [] as Address[],
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const result = await api.getProfile();
      if (result.success && result.data) {
        setProfileData(result.data);
        setEditData({
          name: result.data.name,
          contactNumber: result.data.contactNumber,
          studentLevel: typeof result.data.studentLevel === 'object' 
            ? result.data.studentLevel.name 
            : result.data.studentLevel,
          addresses: result.data.addresses || [],
        });
      } else {
        // Fallback to initial user data if API fails
        if (initialUserData) {
          const fallbackData: User = {
            id: initialUserData.id || '',
            studentId: initialUserData.studentId || '',
            name: initialUserData.name || '',
            email: initialUserData.email || '',
            contactNumber: initialUserData.contactNumber || '',
            profileImage: initialUserData.profileImage || null,
            studentLevel: initialUserData.studentLevel || '',
            role: initialUserData.role || 'student',
            isActive: initialUserData.isActive !== false,
            lastLogin: initialUserData.lastLogin || new Date().toISOString(),
            addresses: initialUserData.addresses || [],
            agent: initialUserData.agent,
          };
          setProfileData(fallbackData);
          setEditData({
            name: fallbackData.name,
            contactNumber: fallbackData.contactNumber,
            studentLevel: typeof fallbackData.studentLevel === 'object' 
              ? fallbackData.studentLevel.name 
              : fallbackData.studentLevel,
            addresses: fallbackData.addresses || [],
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (profileData) {
      setEditData({
        name: profileData.name,
        contactNumber: profileData.contactNumber,
        studentLevel: typeof profileData.studentLevel === 'object' 
          ? profileData.studentLevel.name 
          : profileData.studentLevel,
        addresses: profileData.addresses || [],
      });
      setProfileImage(null);
      setImagePreview('');
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: UpdateProfileRequest = {
        name: editData.name,
        contactNumber: editData.contactNumber,
        studentLevel: editData.studentLevel,
        addresses: editData.addresses,
      };

      if (profileImage) {
        updateData.profileImage = profileImage;
      }

      const result = await api.updateProfile(updateData);

      if (result.success && result.data) {
        setProfileData(result.data);
        setIsEditing(false);
        setProfileImage(null);
        setImagePreview('');
        
        // Update localStorage
        const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        const updatedUserData = { ...currentUserData, ...result.data };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // Notify parent component
        if (onProfileUpdate) {
          onProfileUpdate(result.data);
        }
        
        showSuccess('Profile updated successfully! 🎉');
      } else {
        const errorMessage = result.errors && result.errors.length > 0 
          ? result.errors.join(', ') 
          : result.message || 'Failed to update profile';
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('An error occurred while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = (addressIndex: number) => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser');
      return;
    }

    setIsFetchingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const updatedAddresses = [...editData.addresses];
        if (!updatedAddresses[addressIndex]) {
          updatedAddresses[addressIndex] = {
            areaname: '',
            city: '',
            pincode: '',
            location: { latitude: 0, longitude: 0 },
          };
        }
        updatedAddresses[addressIndex].location = {
          latitude: lat,
          longitude: lng,
        };
        
        setEditData({ ...editData, addresses: updatedAddresses });
        showSuccess('Location fetched successfully! 📍');
        setIsFetchingLocation(false);
      },
      (error) => {
        showError('Unable to retrieve your location');
        setIsFetchingLocation(false);
      }
    );
  };

  const handleAddressChange = (index: number, field: keyof Address, value: any) => {
    const updatedAddresses = [...editData.addresses];
    if (!updatedAddresses[index]) {
      updatedAddresses[index] = {
        areaname: '',
        city: '',
        pincode: '',
        location: { latitude: 0, longitude: 0 },
      };
    }
    (updatedAddresses[index] as any)[field] = value;
    setEditData({ ...editData, addresses: updatedAddresses });
  };

  const addAddress = () => {
    setEditData({
      ...editData,
      addresses: [
        ...editData.addresses,
        {
          areaname: '',
          city: '',
          pincode: '',
          location: { latitude: 0, longitude: 0 },
        },
      ],
    });
  };

  const removeAddress = (index: number) => {
    const updatedAddresses = editData.addresses.filter((_, i) => i !== index);
    setEditData({ ...editData, addresses: updatedAddresses });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <Skeleton variant="text" width="30%" height={40} theme="blue" className="mb-8" />
            <SkeletonProfile theme="blue" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton variant="rounded" height={100} theme="blue" key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-8 flex items-center justify-center">
        <div className="text-white text-xl">No profile data available</div>
      </div>
    );
  }

  const displayImage = imagePreview || profileData.profileImage;
  const studentLevelName = typeof profileData.studentLevel === 'object' 
    ? profileData.studentLevel.name 
    : profileData.studentLevel;
  const studentLevelDesc = typeof profileData.studentLevel === 'object' 
    ? profileData.studentLevel.description 
    : undefined;
  const studentLevelClassRange = typeof profileData.studentLevel === 'object' 
    ? profileData.studentLevel.classRange 
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Profile Image */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/20">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={profileData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-bold">
                    {profileData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                  <Upload size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="bg-white/20 text-white px-3 py-2 rounded-lg w-full max-w-md border border-white/30"
                    placeholder="Name"
                  />
                ) : (
                  profileData.name
                )}
              </h2>
              <p className="text-blue-200 text-sm mb-1">Student ID: {profileData.studentId}</p>
              <p className="text-blue-200 text-sm">Email: {profileData.email}</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Contact Number */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Phone size={18} className="text-blue-300" />
                <span className="text-blue-200 text-sm font-medium">Contact Number</span>
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.contactNumber}
                  onChange={(e) => setEditData({ ...editData, contactNumber: e.target.value })}
                  className="bg-white/20 text-white px-3 py-2 rounded-lg w-full border border-white/30"
                  placeholder="+91XXXXXXXXXX"
                />
              ) : (
                <p className="text-white font-semibold">{profileData.contactNumber || 'Not provided'}</p>
              )}
            </div>

            {/* Student Level */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap size={18} className="text-blue-300" />
                <span className="text-blue-200 text-sm font-medium">Student Level</span>
              </div>
              {isEditing ? (
                <select
                  value={editData.studentLevel}
                  onChange={(e) => setEditData({ ...editData, studentLevel: e.target.value })}
                  className="bg-white/20 text-white px-3 py-2 rounded-lg w-full border border-white/30"
                >
                  <option value="Junior">Junior</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Senior">Senior</option>
                </select>
              ) : (
                <div>
                  <p className="text-white font-semibold">{studentLevelName}</p>
                  {studentLevelDesc && (
                    <p className="text-blue-200 text-xs mt-1">{studentLevelDesc}</p>
                  )}
                  {studentLevelClassRange && (
                    <p className="text-blue-200 text-xs">{studentLevelClassRange}</p>
                  )}
                </div>
              )}
            </div>

            {/* Last Login */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-blue-300" />
                <span className="text-blue-200 text-sm font-medium">Last Login</span>
              </div>
              <p className="text-white font-semibold">{formatDate(profileData.lastLogin)}</p>
            </div>

            {/* Account Status */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck size={18} className="text-blue-300" />
                <span className="text-blue-200 text-sm font-medium">Account Status</span>
              </div>
              <p className={`font-semibold ${profileData.isActive ? 'text-green-400' : 'text-red-400'}`}>
                {profileData.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          {/* Agent Information */}
          {profileData.agent && (
            <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Building size={20} className="text-blue-300" />
                <h3 className="text-xl font-bold text-white">Agent Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-200 text-sm mb-1">Agent Name</p>
                  <p className="text-white font-semibold">{profileData.agent.name}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm mb-1">Email</p>
                  <p className="text-white font-semibold">{profileData.agent.email}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm mb-1">Contact</p>
                  <p className="text-white font-semibold">{profileData.agent.contactNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Addresses */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-blue-300" />
                <h3 className="text-xl font-bold text-white">Addresses</h3>
              </div>
              {isEditing && (
                <button
                  onClick={addAddress}
                  className="text-blue-300 hover:text-blue-200 text-sm flex items-center gap-1"
                >
                  <span>+</span> Add Address
                </button>
              )}
            </div>

            {editData.addresses.length === 0 && !isEditing ? (
              <p className="text-blue-200">No addresses added</p>
            ) : (
              <div className="space-y-4">
                {editData.addresses.map((address, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    {isEditing && (
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={() => removeAddress(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-blue-200 text-sm mb-1">Area Name</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={address.areaname}
                            onChange={(e) => handleAddressChange(index, 'areaname', e.target.value)}
                            className="bg-white/20 text-white px-3 py-2 rounded-lg w-full border border-white/30"
                            placeholder="Area name"
                          />
                        ) : (
                          <p className="text-white font-semibold">{address.areaname || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm mb-1">City</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={address.city}
                            onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                            className="bg-white/20 text-white px-3 py-2 rounded-lg w-full border border-white/30"
                            placeholder="City"
                          />
                        ) : (
                          <p className="text-white font-semibold">{address.city || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm mb-1">Pincode</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={address.pincode}
                            onChange={(e) => handleAddressChange(index, 'pincode', e.target.value)}
                            className="bg-white/20 text-white px-3 py-2 rounded-lg w-full border border-white/30"
                            placeholder="Pincode"
                          />
                        ) : (
                          <p className="text-white font-semibold">{address.pincode || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm mb-1">Location</p>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={address.location.latitude ? address.location.latitude.toFixed(6) : ''}
                              className="bg-white/10 text-white px-3 py-2 rounded-lg w-full border border-white/20 cursor-not-allowed opacity-70"
                              placeholder="Latitude"
                            />
                            <input
                              type="text"
                              readOnly
                              value={address.location.longitude ? address.location.longitude.toFixed(6) : ''}
                              className="bg-white/10 text-white px-3 py-2 rounded-lg w-full border border-white/20 cursor-not-allowed opacity-70"
                              placeholder="Longitude"
                            />
                            <button
                              onClick={() => handleGetLocation(index)}
                              disabled={isFetchingLocation}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                              title="Get current location"
                            >
                              <Navigation size={16} />
                              {isFetchingLocation ? 'Getting...' : 'Get Location'}
                            </button>
                          </div>
                        ) : (
                          <p className="text-white font-semibold">
                            {address.location.latitude && address.location.longitude
                              ? `${address.location.latitude.toFixed(6)}, ${address.location.longitude.toFixed(6)}`
                              : 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Dates */}
          {(profileData.createdAt || profileData.updatedAt) && (
            <div className="mt-6 pt-6 border-t border-white/20 text-center">
              <div className="flex items-center justify-center gap-6 text-blue-200 text-sm">
                {profileData.createdAt && (
                  <div>
                    <span className="text-blue-300">Created:</span> {formatDate(profileData.createdAt)}
                  </div>
                )}
                {profileData.updatedAt && (
                  <div>
                    <span className="text-blue-300">Last Updated:</span> {formatDate(profileData.updatedAt)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

