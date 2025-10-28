import { Mail, Phone, Search, Building2, X, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAreas, selectAreas, selectAreasError, selectAreasLoading } from '../../store/slices/areaSlice';
import { createClientFetch, selectClientsError, selectClientsLoading, updateClientFetch, fetchSalesmenByCity, selectSalesmen, selectSalesmenLoading, selectSalesmenError, clearSalesmen } from '../../store/slices/clientSlice';
import { fetchStates, selectStates, selectStatesLoading, selectStatesError } from '../../store/slices/stateSlice';
import { fetchCitiesByState, selectCitiesByState, selectCitiesLoading, selectCitiesError, clearCitiesByState } from '../../store/slices/citySlice';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '../ui';

const AddClientModal = ({ isOpen, onClose, onSuccess, client = null }) => {
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedStateId, setSelectedStateId] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedSalesman, setSelectedSalesman] = useState('');
    const [areaSearchTerm, setAreaSearchTerm] = useState('');
    const [debouncedAreaSearch, setDebouncedAreaSearch] = useState('');
    const [userChangedState, setUserChangedState] = useState(false);
    const dispatch = useDispatch();
    const areas = useSelector(selectAreas);
    const areasLoading = useSelector(selectAreasLoading);
    const areasError = useSelector(selectAreasError);
    const clientsLoading = useSelector(selectClientsLoading);
    const clientsError = useSelector(selectClientsError);
    const states = useSelector(selectStates);
    const statesLoading = useSelector(selectStatesLoading);
    const statesError = useSelector(selectStatesError);
    const cities = useSelector(selectCitiesByState);
    const citiesLoading = useSelector(selectCitiesLoading);
    const citiesError = useSelector(selectCitiesError);
    const salesmen = useSelector(selectSalesmen);
    const salesmenLoading = useSelector(selectSalesmenLoading);
    const salesmenError = useSelector(selectSalesmenError);

    const isEditMode = !!client;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm();

    // Fetch areas and states when modal opens
    useEffect(() => {
        if (isOpen) {
            if (areas.length === 0) {
                dispatch(fetchAreas({ page: 1, limit: 100 }));
            }
            if (states.length === 0) {
                dispatch(fetchStates());
            }
        }
    }, [isOpen, dispatch, areas.length, states.length]);

    // Fetch cities when state is selected
    useEffect(() => {
        if (selectedStateId) {
            dispatch(fetchCitiesByState(selectedStateId));
        } else {
            dispatch(clearCitiesByState());
            setSelectedCity('');
        }
    }, [selectedStateId, dispatch]);

    // Fetch salesmen when city is selected
    useEffect(() => {
        if (selectedCity) {
            dispatch(fetchSalesmenByCity(selectedCity));
        } else {
            dispatch(clearSalesmen());
            setSelectedSalesman('');
        }
    }, [selectedCity, dispatch]);

    // Set city when cities are loaded in edit mode
    useEffect(() => {
        if (isEditMode && client && cities.length > 0 && !selectedCity && !userChangedState) {
            // Find the city in the loaded cities
            const cityObj = cities.find(city => city.name === client.address?.city);
            if (cityObj) {
                setSelectedCity(cityObj.name);
            }
        }
    }, [isEditMode, client, cities, selectedCity, userChangedState]);

    // Set area when city is set in edit mode
    useEffect(() => {
        if (isEditMode && client && selectedCity && !selectedArea && !userChangedState) {
            // Find the area in the filtered areas
            const areaObj = areas.find(area =>
                area.city === selectedCity &&
                area._id === client.area?._id
            );
            if (areaObj) {
                setSelectedArea(areaObj._id);
                setValue('area', areaObj._id, { shouldValidate: true });
            }
        }
    }, [isEditMode, client, selectedCity, selectedArea, areas, setValue, userChangedState]);

    // Populate form when in edit mode
    useEffect(() => {
        if (isEditMode && client && isOpen && areas.length > 0 && states.length > 0) {
            reset();
            setValue('name', client.name);
            setValue('company', client.company || '');
            setValue('email', client.email || '');
            setValue('phone', client.phone);
            setValue('address.street', client.address?.street || '');
            setValue('address.zipCode', client.address?.zipCode || '');
            setValue('notes', client.notes || '');
            setSelectedArea(client.area?._id || '');
            setSelectedState(client.address?.state || '');
            setSelectedCity(client.address?.city || '');

            // Find state ID from state name and fetch cities
            const stateObj = states.find(s => s.name === client.address?.state);
            if (stateObj) {
                setSelectedStateId(stateObj._id);
                // Fetch cities for the state
                dispatch(fetchCitiesByState(stateObj._id));
            }

            // Clear area search when populating
            setAreaSearchTerm('');
            setDebouncedAreaSearch('');
        }
    }, [isEditMode, client, isOpen, reset, setValue, areas.length, states, dispatch]);

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

    // Filter areas based on search term, selected city, and active status
    const filteredAreas = useMemo(() => {
        // First filter by active status
        let filtered = areas.filter(area => area.isActive);

        // Filter by selected city if available
        if (selectedCity) {
            filtered = filtered.filter(area => area.city === selectedCity);
        }

        // Filter by search term if available
        if (debouncedAreaSearch) {
            const searchLower = debouncedAreaSearch.toLowerCase();
            filtered = filtered.filter(area =>
                area.name.toLowerCase().includes(searchLower) ||
                area.city.toLowerCase().includes(searchLower) ||
                area.state.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [areas, debouncedAreaSearch, selectedCity]);

    const onSubmit = async (data) => {
        try {
            const clientData = {
                ...data,
                area: selectedArea,
                salesman: selectedSalesman,
                address: {
                    ...data.address,
                    state: selectedState,
                    city: selectedCity
                },
                isActive: client?.isActive ?? true
            };

            let result;
            if (isEditMode) {
                result = await dispatch(updateClientFetch({ clientId: client._id, clientData })).unwrap();
                toast.success('Client updated successfully!');
                // Close modal after successful update
                onClose();
            } else {
                result = await dispatch(createClientFetch(clientData)).unwrap();
                toast.success('Client created successfully!');
                onSuccess(result);
            }

            // Reset form
            reset();
            setSelectedArea('');
            setSelectedSalesman('');
            setAreaSearchTerm('');
            setDebouncedAreaSearch('');
        } catch (error) {
            toast.error(typeof error === 'string' ? error : `Failed to ${isEditMode ? 'update' : 'create'} client`);
        }
    };

    const handleClose = () => {
        reset();
        setSelectedArea('');
        setSelectedSalesman('');
        setSelectedState('');
        setSelectedStateId('');
        setSelectedCity('');
        setAreaSearchTerm('');
        setDebouncedAreaSearch('');
        setUserChangedState(false);
        dispatch(clearCitiesByState());
        dispatch(clearSalesmen());
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle>{isEditMode ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                            <DialogDescription>
                                {isEditMode ? 'Update client information and details' : 'Create a new client with contact information and area assignment'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Error Display */}
                    {clientsError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{typeof clientsError === 'string' ? clientsError : 'An error occurred'}</p>
                        </div>
                    )}

                    {/* Client Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Client Name *
                            </label>
                            <Input
                                {...register('name', {
                                    required: 'Client name is required',
                                    minLength: { value: 2, message: 'Min 2 characters' }
                                })}
                                placeholder="John Doe"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Company *
                            </label>
                            <Input
                                {...register('company', {
                                    required: 'Company is required',
                                    minLength: { value: 2, message: 'Min 2 characters' }
                                })}
                                {...register('company')}
                                placeholder="ABC Company"
                            />
                            {errors.company && (
                                <p className="text-sm text-red-600">{errors.company.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="relative">
                                <Input
                                    {...register('email', {
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
                                Phone Number *
                            </label>
                            <div className="relative">
                                <Input
                                    {...register('phone', {
                                        required: 'Phone number is required',
                                        pattern: {
                                            value: /^[0-9]{10}$/,
                                            message: 'Phone number must be 10 digits'
                                        }
                                    })}
                                    placeholder="9876543210"
                                    className="pl-10"
                                    type="tel"
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

                    {/* Address Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Address Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Street Address
                                </label>
                                <Input
                                    {...register('address.street')}
                                    placeholder="123 Main Street"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    State *
                                </label>
                                <Select
                                    value={selectedState}
                                    onValueChange={(stateName) => {
                                        setSelectedState(stateName);
                                        const stateObj = states.find(s => s.name === stateName);
                                        setSelectedStateId(stateObj?._id || '');
                                        // Clear city and area when state changes
                                        setSelectedCity('');
                                        setSelectedArea('');
                                        setValue('area', '', { shouldValidate: true });
                                        // Mark that user manually changed state
                                        setUserChangedState(true);
                                    }}
                                    disabled={statesLoading}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select state..." />
                                    </SelectTrigger>
                                    <SelectContent position="popper" side="bottom" align="start">
                                        {states.length > 0 ? (
                                            states.map((state) => (
                                                <SelectItem key={state._id} value={state.name}>
                                                    {state.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-sm text-gray-500">
                                                {statesLoading ? 'Loading states...' : 'No states found'}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {statesError && (
                                    <p className="text-sm text-red-600">{typeof statesError === 'string' ? statesError : 'An error occurred'}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    City *
                                </label>
                                <Select
                                    value={selectedCity}
                                    onValueChange={(cityName) => {
                                        setSelectedCity(cityName);
                                        // Clear area and salesman selection when city changes
                                        setSelectedArea('');
                                        setSelectedSalesman('');
                                        setValue('area', '', { shouldValidate: true });
                                        setValue('salesman', '', { shouldValidate: true });
                                    }}
                                    disabled={!selectedState || citiesLoading}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={!selectedState ? "Select state first..." : "Select city..."} />
                                    </SelectTrigger>
                                    <SelectContent position="popper" side="bottom" align="start">
                                        {cities.length > 0 ? (
                                            cities.map((city) => (
                                                <SelectItem key={city._id} value={city.name}>
                                                    {city.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-sm text-gray-500">
                                                {citiesLoading ? 'Loading cities...' : !selectedState ? 'Select a state first' : 'No cities found'}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {citiesError && (
                                    <p className="text-sm text-red-600">{typeof citiesError === 'string' ? citiesError : 'An error occurred'}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    ZIP Code
                                </label>
                                <Input
                                    {...register('address.zipCode')}
                                    placeholder="400001"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Area and Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Area *
                            </label>
                            {/* Hidden input for form validation */}
                            <input
                                type="hidden"
                                {...register('area', { required: 'Area is required' })}
                                value={selectedArea}
                            />
                            <div className="relative">
                                <Select
                                    value={selectedArea}
                                    onValueChange={(value) => {
                                        setSelectedArea(value);
                                        setValue('area', value, { shouldValidate: true });
                                    }}
                                    disabled={areasLoading || !selectedCity}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={!selectedCity ? "Select city first..." : "Select an area..."} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]" position="popper" side="bottom" align="start">
                                        {/* Search Input */}
                                        <div className="p-2 border-b">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search areas..."
                                                    value={areaSearchTerm}
                                                    onChange={(e) => setAreaSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-10 h-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            {filteredAreas.length > 0 ? (
                                                filteredAreas.map((area) => (
                                                    <SelectItem key={area._id} value={area._id}>
                                                        {area.name} - {area.city}, {area.state}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-3 text-center text-sm text-gray-500">
                                                    {areasLoading ? 'Loading areas...' :
                                                        selectedCity ? `No areas found for ${selectedCity}` :
                                                            'Select a city first'}
                                                </div>
                                            )}
                                        </div>
                                    </SelectContent>
                                </Select>
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
                                Salesman *
                            </label>
                            {/* Hidden input for form validation */}
                            <input
                                type="hidden"
                                {...register('salesman', { required: 'Salesman is required' })}
                                value={selectedSalesman}
                            />
                            <Select
                                value={selectedSalesman}
                                onValueChange={(value) => {
                                    setSelectedSalesman(value);
                                    setValue('salesman', value, { shouldValidate: true });
                                }}
                                disabled={salesmenLoading || !selectedCity}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={!selectedCity ? "Select city first..." : "Select a salesman..."} />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" align="start">
                                    {salesmen.length > 0 ? (
                                        salesmen.map((salesman) => (
                                            <SelectItem key={salesman._id} value={salesman._id}>
                                                {salesman.firstName} {salesman.lastName} - {salesman.area?.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-sm text-gray-500">
                                            {salesmenLoading ? 'Loading salesmen...' :
                                                selectedCity ? `No salesmen found for ${selectedCity}` :
                                                    'Select a city first'}
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            {errors.salesman && (
                                <p className="text-sm text-red-600">{errors.salesman.message}</p>
                            )}
                            {salesmenError && (
                                <p className="text-sm text-red-600">{typeof salesmenError === 'string' ? salesmenError : 'An error occurred'}</p>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Notes
                        </label>
                        <Textarea
                            {...register('notes')}
                            placeholder="Additional notes about the client..."
                            rows={3}
                        />
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
                            disabled={clientsLoading}
                        >
                            {clientsLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Client' : 'Create Client')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddClientModal;
