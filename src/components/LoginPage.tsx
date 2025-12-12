import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, GraduationCap, Phone, MapPin, Upload, Navigation, UserPlus } from 'lucide-react';
import { useToast } from './ToastContainer';
import { api } from '../api';

interface LoginPageProps {
  onLogin: (userData: any) => void;
  onDemoLogin: () => void;
}

export default function LoginPage({ onLogin, onDemoLogin }: LoginPageProps) {
  const { showSuccess, showError } = useToast();
  const [isSignup, setIsSignup] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const TOTAL_SIGNUP_STEPS = 3;

  const LEVEL_OPTIONS = [
    { id: 'junior', label: 'Junior', desc: 'Building foundation' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
    { id: 'advanced', label: 'Advanced', desc: 'Confident & skilled' },
  ] as const;
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentLevel: '',
    contactNumber: '',
    agentId: '',
    areaname: '',
    city: '',
    pincode: '',
    latitude: '',
    longitude: '',
  });

  const goToStep = (step: number) => {
    setSignupStep(Math.min(TOTAL_SIGNUP_STEPS, Math.max(1, step)));
  };

  const handleNextStep = () => {
    if (signupStep === 1) {
      if (!formData.name || !formData.email || !formData.contactNumber || !formData.studentLevel) {
        showError('Please fill all required details in this step before continuing.');
        return;
      }
    }

    goToStep(signupStep + 1);
  };

  const handlePrevStep = () => {
    goToStep(signupStep - 1);
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

  const handlePincodeLookup = async () => {
    const rawPincode = formData.pincode.trim();

    // Only call API when a valid 6-digit PIN code is entered
    if (!rawPincode || rawPincode.length !== 6 || !/^\d{6}$/.test(rawPincode)) {
      return;
    }

    setIsFetchingPincode(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${rawPincode}`);
      const data = await response.json();

      const result = Array.isArray(data) ? data[0] : null;

      if (result && result.Status === 'Success' && Array.isArray(result.PostOffice) && result.PostOffice.length > 0) {
        const office = result.PostOffice[0];

        setFormData((prev) => ({
          ...prev,
          areaname: office.Name || prev.areaname,
          city: office.District || office.Region || prev.city,
          pincode: rawPincode,
        }));

        showSuccess('PIN code found. Address auto-filled.');
      } else {
        showError('Could not find details for this PIN code. Please check and try again.');
      }
    } catch (error) {
      console.error('Pincode lookup error:', error);
      showError('Failed to fetch PIN code details. Please try again.');
    } finally {
      setIsFetchingPincode(false);
    }
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
        // Prepare addresses if all fields are provided
        let addresses;
        if (formData.areaname && formData.city && formData.pincode && formData.latitude && formData.longitude) {
          addresses = [{
            areaname: formData.areaname,
            city: formData.city,
            pincode: formData.pincode,
            location: {
              latitude: parseFloat(formData.latitude),
              longitude: parseFloat(formData.longitude)
            }
          }];
        }

        // Make API call for signup
        const result = await api.signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          contactNumber: formData.contactNumber,
          studentLevel: formData.studentLevel,
          agentId: formData.agentId.trim() || undefined,
          profileImage: profileImage || undefined,
          addresses: addresses,
        });

        if (result.success) {
          showSuccess('Account created successfully! Please login.');
          setIsSignup(false);
          setSignupStep(1);
          setFormData({ 
            name: '', 
            email: '', 
            password: '', 
            confirmPassword: '',
            studentLevel: '',
            contactNumber: '',
            agentId: '',
            areaname: '',
            city: '',
            pincode: '',
            latitude: '',
            longitude: '',
          });
          setProfileImage(null);
          setImagePreview('');
        } else {
          const errorMessage = result.errors && result.errors.length > 0 
            ? result.errors.join(', ') 
            : result.message || 'Signup failed. Please try again.';
          showError(errorMessage);
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
        const result = await api.login(formData.email, formData.password);

        if (result.success && result.data) {
          // Save token to localStorage
          localStorage.setItem('authToken', result.data.token);
          localStorage.setItem('userData', JSON.stringify(result.data));
          
          // Show success message
          showSuccess(`Welcome back, ${result.data.name}! 🎉`);
          
          // Call onLogin with user data
          onLogin(result.data);
        } else {
          const errorMessage = result.errors && result.errors.length > 0 
            ? result.errors.join(', ') 
            : result.message || 'Login failed. Please check your credentials.';
          showError(errorMessage);
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
          <div className="mb-4 text-center flex-shrink-0">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-500">
              {isSignup 
                ? 'Sign up to start your learning journey' 
                : 'Sign in to continue your learning'}
            </p>
          </div>

          {isSignup && (
            <div className="mb-4 flex items-center justify-center gap-3 flex-shrink-0">
              <span className="text-xs font-semibold text-blue-600">
                Step {signupStep} of {TOTAL_SIGNUP_STEPS}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 w-6 rounded-full ${
                      signupStep === step ? 'bg-blue-600' : 'bg-blue-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="space-y-4 overflow-y-auto pr-4 pb-3 flex-1 custom-scrollbar rounded-2xl bg-slate-50/60 px-4 pt-4">
            {isSignup && signupStep === 1 && (
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
            {(!isSignup || signupStep === 1) && (
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
            )}

            {/* Contact Number - Only for Signup */}
            {isSignup && signupStep === 1 && (
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
            {isSignup && signupStep === 1 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Level *
                </label>
                <p className="text-xs text-gray-500">
                  Choose your current experience level so we can personalize your learning journey.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {LEVEL_OPTIONS.map((level) => {
                    const isSelected = formData.studentLevel === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, studentLevel: level.id })}
                        className={`group relative flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-200 ease-out ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/60 hover:-translate-y-0.5 hover:shadow-md'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <div className="flex items-center w-full mb-1 gap-2">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            <GraduationCap size={16} />
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              isSelected ? 'text-blue-700' : 'text-gray-800'
                            }`}
                          >
                            {level.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 group-hover:text-gray-600">
                          {level.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agent Code / Referral Code - Only for Signup (Optional) */}
            {isSignup && signupStep === 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent/Referral Code (Optional)
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={formData.agentId}
                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter agent/referral code if you have one"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  If you were referred by an agent, enter their code here
                </p>
              </div>
            )}

            {/* Address Fields - Only for Signup (Optional but if provided, all fields required) */}
            {isSignup && signupStep === 2 && (
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
                <div className="relative flex gap-2">
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    onBlur={handlePincodeLookup}
                    maxLength={6}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="Pincode (e.g. 110001)"
                  />
                  <button
                    type="button"
                    onClick={handlePincodeLookup}
                    disabled={isFetchingPincode}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                      isFetchingPincode
                        ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {isFetchingPincode ? 'Fetching...' : 'Lookup'}
                  </button>
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
            {(!isSignup || signupStep === 3) && (
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
            )}

            {/* Confirm Password - Only for Signup */}
            {isSignup && signupStep === 3 && (
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
            {isSignup ? (
              <div className="flex items-center gap-3">
                {signupStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="w-1/3 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                )}
                <button
                  type={signupStep === TOTAL_SIGNUP_STEPS ? 'submit' : 'button'}
                  onClick={signupStep === TOTAL_SIGNUP_STEPS ? undefined : handleNextStep}
                  disabled={isLoading}
                  className={`flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all ${
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
                  ) : signupStep === TOTAL_SIGNUP_STEPS ? (
                    'Create Account'
                  ) : (
                    'Next'
                  )}
                </button>
              </div>
            ) : (
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
                  'Sign In'
                )}
              </button>
            )}

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
                  setSignupStep(1);
                  setFormData({ 
                    name: '', 
                    email: '', 
                    password: '', 
                    confirmPassword: '',
                    studentLevel: '',
                    contactNumber: '',
                    agentId: '',
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

