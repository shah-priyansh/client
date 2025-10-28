import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { addAreaFetch, updateAreaFetch } from '../../store/slices/areaSlice';
import {
  clearCitiesByState,
  fetchCitiesByState,
  selectCitiesByState,
  selectCitiesError,
  selectCitiesLoading
} from '../../store/slices/citySlice';
import {
  fetchStates,
  selectStates,
  selectStatesError,
  selectStatesLoading
} from '../../store/slices/stateSlice';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';

const AddAreaModal = ({ isOpen, onClose, area = null }) => {  
  const dispatch = useDispatch();
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      name: '',
      state: '',
      city: '',
      isActive: 'true'
    }
  });

  // Redux selectors
  const states = useSelector(selectStates);
  const statesLoading = useSelector(selectStatesLoading);
  const statesError = useSelector(selectStatesError);
  const cities = useSelector(selectCitiesByState);
  const citiesLoading = useSelector(selectCitiesLoading);
  const citiesError = useSelector(selectCitiesError);

  // Watch form values
  const watchedState = watch('state');
  const watchedCity = watch('city');

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Initialize form with area data when editing
  useEffect(() => {
    if (isOpen && area && states.length > 0) {
      reset();
      
      setValue('name', area.name || '');
      setValue('isActive', area.isActive ? 'true' : 'false');
      
      // Find the state by name and set the state ID
      const stateData = states.find(state => state.name === area.state);
      if (stateData) {
        setValue('state', stateData._id);
        setSelectedState(stateData._id);
        
        // Fetch cities for this state
        dispatch(fetchCitiesByState(stateData._id));
      }
      
      // Set the city name for display (will be updated when cities load)
      setSelectedCity('');
    }
  }, [isOpen, area, setValue, states, dispatch, reset]);

  // Set city ID when cities are loaded in edit mode
  useEffect(() => {
    if (isOpen && area && cities.length > 0 && !selectedCity) {
      const cityData = cities.find(city => city.name === area.city);
      if (cityData) {
        setValue('city', cityData._id, { shouldValidate: false });
        setSelectedCity(cityData._id);
      }
    }
  }, [isOpen, area, cities, selectedCity, setValue]);

  // Fetch states on component mount
  useEffect(() => {
    if (isOpen && states.length === 0) {
      dispatch(fetchStates());
    }
  }, [isOpen, dispatch, states.length]);

  // Auto-fetch Gujarat cities when component opens (special case)
  useEffect(() => {
    if (isOpen && states.length > 0) {
      const gujaratState = states.find(state => state.name.toLowerCase() === 'gujarat');
      if (gujaratState && !selectedState) {
        setSelectedState(gujaratState._id);
        setValue('state', gujaratState._id);
        dispatch(fetchCitiesByState(gujaratState._id));
      }
    }
  }, [isOpen, states, selectedState, setValue, dispatch]);

  // Handle state selection
  useEffect(() => {
    if (watchedState && watchedState !== selectedState) {
      setSelectedState(watchedState);
      setSelectedCity(''); // Reset city when state changes
      setValue('city', '');
      dispatch(clearCitiesByState());

      // Fetch cities for selected state
      dispatch(fetchCitiesByState(watchedState));
    }
  }, [watchedState, selectedState, setValue, dispatch]);

  // Handle city selection
  useEffect(() => {
    if (watchedCity && watchedCity !== selectedCity) {
      setSelectedCity(watchedCity);
    }
  }, [watchedCity, selectedCity]);

  // Check if selected state is Gujarat
  const isGujarat = states.find(state => state._id === selectedState)?.name?.toLowerCase() === 'gujarat';

  const onSubmit = async (data) => {

    // Get state and city names for the form data
    const selectedStateData = states.find(state => state._id === data.state);
    const selectedCityData = cities.find(city => city._id === data.city);
    
    const formData = {
      ...data,
      state: selectedStateData?.name || '',
      city: selectedCityData?.name || '',
      stateId: data.state,
      cityId: data.city
    };

    
    try {
      let result;
      
      if (area) {
        // Edit mode - update existing area
        result = await dispatch(updateAreaFetch({ id: area._id, data: formData }));
      } else {
        // Add mode - create new area
        result = await dispatch(addAreaFetch(formData));
      }
      
      if ((area ? updateAreaFetch : addAreaFetch).fulfilled.match(result)) {
        // API call successful
        reset();
        setSelectedState('');
        setSelectedCity('');
        dispatch(clearCitiesByState());
        onClose(); // Close the modal
      } else {
        // API call failed
      }
    } catch (error) {
      console.error(`Error ${area ? 'updating' : 'creating'} area:`, error);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedState('');
    setSelectedCity('');
    dispatch(clearCitiesByState());
    onClose();
  };

  // Prepare options for comboboxes
  const stateOptions = states.map(state => ({
    value: state._id,
    label: state.name
  }));

  const cityOptions = cities.map(city => ({
    value: city._id,
    label: city.name
  }));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>{area ? 'Edit Area' : 'Add New Area'}</DialogTitle>
              <DialogDescription>
                {area ? 'Update the area information' : 'Create a new sales territory for your business'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              State *
            </label>
            <div className="relative">
              <Select
                value={selectedState}
                onValueChange={(value) => {
                  setValue('state', value, { shouldValidate: true });
                }}
                disabled={statesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a state..." />
                </SelectTrigger>
                <SelectContent>
                  {statesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading states...
                    </SelectItem>
                  ) : stateOptions.length === 0 ? (
                    <SelectItem value="no-states" disabled>
                      No states found
                    </SelectItem>
                  ) : (
                    stateOptions.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register('state', { required: 'State is required' })}
              />
            </div>
            {errors.state && (
              <p className="text-sm text-red-600">{errors.state.message}</p>
            )}
            {statesError && (
              <p className="text-sm text-red-600">{statesError}</p>
            )}
          </div>
          {(selectedState || isGujarat) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                City *
              </label>
              <div className="relative">
                <Select
                  value={selectedCity}
                  onValueChange={(value) => {
                    setSelectedCity(value);
                    setValue('city', value, { shouldValidate: true });
                  }}
                  disabled={citiesLoading || (!selectedState && !isGujarat)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a city..." />
                  </SelectTrigger>
                  <SelectContent>
                    {citiesLoading ? (
                      <SelectItem value="loading-cities" disabled>
                        Loading cities...
                      </SelectItem>
                    ) : cityOptions.length === 0 ? (
                      <SelectItem value="no-cities" disabled>
                        No cities found for this state
                      </SelectItem>
                    ) : (
                      cityOptions.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  {...register('city', { required: 'City is required' })}
                />
              </div>
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city.message}</p>
              )}
              {citiesError && (
                <p className="text-sm text-red-600">{citiesError}</p>
              )}
            </div>
          )}

          {/* Area Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Area Name *
            </label>
            <div className="relative">
              <Input
                {...register('name', {
                  required: 'Area name is required',
                  minLength: { value: 2, message: 'Min 2 characters' }
                })}
                placeholder="e.g., Downtown District"
                className="pl-10"
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Status Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Status
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="true"
                  {...register('isActive')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">Active</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="false"
                  {...register('isActive')}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-900">Inactive</span>
              </label>
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
            >
              {area ? 'Update Area' : 'Create Area'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAreaModal;
