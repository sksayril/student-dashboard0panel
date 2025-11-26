import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, GraduationCap, Phone, MapPin, Upload, Navigation } from 'lucide-react';
import { useToast } from './ToastContainer';

interface LoginPageProps {
  onLogin: (userData: any) => void;
  onDemoLogin: () => void;
}

export default function LoginPage({ onLogin, onDemoLogin }: LoginPageProps) {
  const { showSuccess, showError } = useToast();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentLevel: '',
    contactNumber: '',
    areaname: '',
    city: '',
    pincode: '',
    latitude: '',
    longitude: '',
  });

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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser');
      return;
    }

    setIsFetchingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        
        setFormData({
          ...formData,
          latitude: lat,
          longitude: lng,
        });
        
        showSuccess('Location fetched successfully! 📍');
        setIsFetchingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        showError(errorMessage);
        setIsFetchingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignup) {
      if (formData.password !== formData.confirmPassword) {
        showError('Passwords do not match!');
        setIsLoading(false);
        return;
      }

      try {
        // Prepare form data for API
        const apiFormData = new FormData();
        apiFormData.append('name', formData.name);
        apiFormData.append('email', formData.email);
        apiFormData.append('password', formData.password);
        apiFormData.append('contactNumber', formData.contactNumber);
        apiFormData.append('studentLevel', formData.studentLevel);

        // Add profile image if selected
        if (profileImage) {
          apiFormData.append('profileImage', profileImage);
        }

        // Add address only if all required fields including location are provided
        if (formData.areaname && formData.city && formData.pincode && formData.latitude && formData.longitude) {
          const addresses = [{
            areaname: formData.areaname,
            city: formData.city,
            pincode: formData.pincode,
            location: {
              latitude: parseFloat(formData.latitude),
              longitude: parseFloat(formData.longitude)
            }
          }];
          apiFormData.append('addresses', JSON.stringify(addresses));
        }

        // Make API call for signup
        const response = await fetch('https://7bb3rgsz-3000.inc1.devtunnels.ms/api/students/signup', {
          method: 'POST',
          body: apiFormData,
        });

        const data = await response.json();

        if (response.ok) {
          showSuccess('Account created successfully! Please login.');
          setIsSignup(false);
          setFormData({ 
            name: '', 
            email: '', 
            password: '', 
            confirmPassword: '',
            studentLevel: '',
            contactNumber: '',
            areaname: '',
            city: '',
            pincode: '',
            latitude: '',
            longitude: '',
          });
          setProfileImage(null);
          setImagePreview('');
        } else {
          showError(data.message || 'Signup failed. Please try again.');
        }
      } catch (error) {
        console.error('Signup error:', error);
        showError('An error occurred during signup. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle Login
      try {
        const response = await fetch('https://7bb3rgsz-3000.inc1.devtunnels.ms/api/students/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Save token to localStorage
          localStorage.setItem('authToken', result.data.token);
          localStorage.setItem('userData', JSON.stringify(result.data));
          
          // Show success message
          showSuccess(`Welcome back, ${result.data.name}! 🎉`);
          
          // Call onLogin with user data
          onLogin(result.data);
        } else {
          showError(result.message || 'Login failed. Please check your credentials.');
        }
      } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDemoLogin = () => {
    onDemoLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center p-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-6xl grid md:grid-cols-2 gap-8 items-stretch mx-auto px-4">
        {/* Left Side - Branding */}
        <div className="hidden md:block text-white space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
              <GraduationCap size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AdhyanGuru</h1>
              <p className="text-blue-200">Student Learning Platform</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Transform Your Learning Journey
            </h2>
            <p className="text-blue-200 text-lg">
              Track your progress, connect with teammates, and achieve your educational goals with our comprehensive student dashboard.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-blue-200">Students</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">50+</div>
              <div className="text-sm text-blue-200">Courses</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-sm text-blue-200">Success</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login/Signup Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] overflow-hidden w-full">
          <div className="mb-6 text-center flex-shrink-0">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-500">
              {isSignup 
                ? 'Sign up to start your learning journey' 
                : 'Sign in to continue your learning'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="space-y-4 overflow-y-auto overflow-x-hidden pr-2 pb-2 flex-1 custom-scrollbar">
            {isSignup && (
              <>
                {/* Profile Image Upload */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Profile Image (Optional)
                  </label>
                  <div className="flex justify-center">
                    <label className="cursor-pointer">
                      <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Upload className="mx-auto text-blue-400" size={24} />
                            <span className="text-xs text-gray-500 mt-1">Upload</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter your full name"
                      required={isSignup}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Contact Number - Only for Signup */}
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="+91 9876543210"
                    required={isSignup}
                  />
                </div>
              </div>
            )}

            {/* Student Level - Only for Signup (Required) */}
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Level *
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={formData.studentLevel}
                    onChange={(e) => setFormData({ ...formData, studentLevel: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                    required={isSignup}
                  >
                    <option value="">Select your level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            )}

            {/* Address Fields - Only for Signup (Optional but if provided, all fields required) */}
            {isSignup && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Address (Optional - Fill all fields if providing address)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative min-w-0">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={formData.areaname}
                      onChange={(e) => setFormData({ ...formData, areaname: e.target.value })}
                      className="w-full min-w-0 pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Area/Locality"
                    />
                  </div>
                  <div className="relative min-w-0">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full min-w-0 px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="City"
                    />
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="Pincode"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Location Coordinates</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isFetchingLocation}
                      className={`flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium transition-all ${
                        isFetchingLocation 
                          ? 'opacity-70 cursor-not-allowed' 
                          : 'hover:bg-blue-600 hover:shadow-md'
                      }`}
                    >
                      <Navigation size={14} className={isFetchingLocation ? 'animate-pulse' : ''} />
                      {isFetchingLocation ? 'Getting Location...' : 'Get My Location'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative min-w-0">
                      <input
                        type="text"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        className="w-full min-w-0 px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="Latitude (e.g. 22.5867)"
                      />
                    </div>
                    <div className="relative min-w-0">
                      <input
                        type="text"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        className="w-full min-w-0 px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="Longitude (e.g. 88.4214)"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-start gap-1">
                  <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                  <span>Location coordinates are required if you provide address details. Click "Get My Location" for automatic detection.</span>
                </p>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password - Only for Signup */}
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Confirm your password"
                    required={isSignup}
                  />
                </div>
              </div>
            )}

            {!isSignup && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot Password?
                </a>
              </div>
            )}
            </div>

            <div className="mt-5 space-y-4 flex-shrink-0">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isSignup ? 'Create Account' : 'Sign In'
              )}
            </button>

            {!isSignup && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <GraduationCap size={20} />
                  Try Demo Login
                </button>
              </>
            )}
            </div>
          </form>

          <div className="mt-4 text-center flex-shrink-0">
            <p className="text-gray-600">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setFormData({ 
                    name: '', 
                    email: '', 
                    password: '', 
                    confirmPassword: '',
                    studentLevel: '',
                    contactNumber: '',
                    areaname: '',
                    city: '',
                    pincode: '',
                    latitude: '',
                    longitude: '',
                  });
                  setProfileImage(null);
                  setImagePreview('');
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

