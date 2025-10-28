import { Mail, Phone, Search, User, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAreas, selectAreas, selectAreasError, selectAreasLoading } from '../../store/slices/areaSlice';
import { createUserFetch, selectUsersError, selectUsersLoading, updateUserFetch } from '../../store/slices/userSlice';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';

const AddUserModal = ({ isOpen, onClose, onSuccess, user = null }) => {
  const [selectedRole, setSelectedRole] = useState('salesman');
  const [selectedArea, setSelectedArea] = useState('');
  const [areaSearchTerm, setAreaSearchTerm] = useState('');
  const [debouncedAreaSearch, setDebouncedAreaSearch] = useState('');
  const dispatch = useDispatch();
  const areas = useSelector(selectAreas);
  const areasLoading = useSelector(selectAreasLoading);
  const areasError = useSelector(selectAreasError);
  const usersLoading = useSelector(selectUsersLoading);
  const usersError = useSelector(selectUsersError);
  
  const isEditMode = !!user;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  // Fetch areas when modal opens
  useEffect(() => {
    if (isOpen && areas.length === 0) {
      dispatch(fetchAreas({ page: 1, limit: 100 }));
    }
  }, [isOpen, dispatch, areas.length]);

  // Populate form when in edit mode
  useEffect(() => {
    if (isEditMode && user && isOpen && areas.length > 0) {
      reset();
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName);
      setValue('email', user.email);
      setValue('phone', user.phone);
      setValue('area', user.area?._id || '');
      setSelectedRole(user.role || 'salesman');
      setSelectedArea(user.area?._id || '');
      // Clear area search when populating
      setAreaSearchTerm('');
      setDebouncedAreaSearch('');
    }
  }, [isEditMode, user, isOpen, reset, setValue, areas.length]);

  // Update form value when selectedArea changes
  useEffect(() => {
    if (selectedArea) {
      setValue('area', selectedArea, { shouldValidate: true });
    }
  }, [selectedArea, setValue]);

  // Debounced search for areas
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAreaSearch(areaSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [areaSearchTerm]);

  const filteredAreas = useMemo(() => {
    const activeAreas = areas.filter(area => area.isActive);
    
    if (!debouncedAreaSearch.trim()) {
      return activeAreas;
    }
    
    const searchLower = debouncedAreaSearch.toLowerCase();
    return activeAreas.filter(area => 
      area.name.toLowerCase().includes(searchLower) ||
      area.city.toLowerCase().includes(searchLower) ||
      area.state.toLowerCase().includes(searchLower)
    );
  }, [areas, debouncedAreaSearch]);

  const onSubmit = async (data) => {
    try {
      const userData = {
        ...data,
        role: selectedRole,
        area: selectedArea,
        isActive: user?.isActive ?? true
      };
      
      let result;
      if (isEditMode) {
        result = await dispatch(updateUserFetch({ userId: user._id, userData })).unwrap();
        toast.success('User updated successfully!');
        // Close modal after successful update
        onClose();
      } else {
        result = await dispatch(createUserFetch(userData)).unwrap();
        toast.success(`User created successfully! Password: ${result.password}`);
        onSuccess(result);
      }
      
      // Reset form
      reset();
      setSelectedArea('');
      setAreaSearchTerm('');
      setDebouncedAreaSearch('');
    } catch (error) {
      toast.error(typeof error === 'string' ? error : `Failed to ${isEditMode ? 'update' : 'create'} user`);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedArea('');
    setAreaSearchTerm('');
    setDebouncedAreaSearch('');
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Update user information and access levels' : 'Create a new team member with appropriate access levels'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Display */}
          {usersError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{typeof usersError === 'string' ? usersError : 'An error occurred'}</p>
            </div>
          )}
          
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                First Name *
              </label>
              <Input
                {...register('firstName', { 
                  required: 'First name is required',
                  minLength: { value: 2, message: 'Min 2 characters' }
                })}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <Input
                {...register('lastName', { 
                  required: 'Last name is required',
                  minLength: { value: 2, message: 'Min 2 characters' }
                })}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email * {isEditMode && <span className="text-xs text-gray-500">(Cannot be changed)</span>}
              </label>
              <div className="relative">
                <Input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { 
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  placeholder="john.doe@example.com"
                  className={`pl-10 ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={isEditMode}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Auto-generated:</strong> A secure password will be automatically generated for this user.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Area *
              </label>
              <div className="relative">
                <Select
                  value={selectedArea}
                  onValueChange={(value) => {
                    setSelectedArea(value);
                    setValue('area', value, { shouldValidate: true });
                  }}
                  disabled={areasLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an area..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]" position="popper" side="bottom" align="start">
                    {/* Search Input */}
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search areas..."
                          value={areaSearchTerm}
                          onChange={(e) => setAreaSearchTerm(e.target.value)}
                          className="pl-10 pr-10 h-8 text-sm"
                        />
                        {areaSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setAreaSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Area Options */}
                    <div className="max-h-[200px] overflow-y-auto">
                      {areasLoading ? (
                        <div className="p-3 text-center text-sm text-gray-500">
                          Loading areas...
                        </div>
                      ) : filteredAreas.length === 0 ? (
                        <div className="p-3 text-center text-sm text-gray-500">
                          {debouncedAreaSearch ? 'No areas found matching your search' : 'No areas found'}
                        </div>
                      ) : (
                        filteredAreas.map((area) => (
                          <SelectItem key={area._id} value={area._id} className="py-2">
                            <div className="flex flex-col">
                              <span className="font-medium">{area.name}</span>
                              <span className="text-xs text-gray-500">{area.city}, {area.state}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </div>
                  </SelectContent>
                </Select>
                {/* Hidden input for form validation */}
                <input
                  type="hidden"
                  {...register('area', { required: 'Area is required' })}
                  value={selectedArea}
                />
              </div>
              {errors.area && (
                <p className="text-sm text-red-600">{errors.area.message}</p>
              )}
              {areasError && (
                <p className="text-sm text-red-600">{typeof areasError === 'string' ? areasError : 'An error occurred'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="relative">
                <Input
                  {...register('phone')}
                  placeholder="+91 XXXXXXXXXX"
                  className="pl-10"
                  type="tel"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  minLength={10}
                />

                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={usersLoading}
            >
              {usersLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update User' : 'Create User')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
