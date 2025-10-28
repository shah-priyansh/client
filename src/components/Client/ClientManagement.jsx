import { Edit, Mail, Phone, Plus, Trash2, Building2, Filter, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteClientFetch,
  fetchClients,
  selectClients,
  selectClientsError,
  selectClientsLoading,
  selectClientsPagination,
  toggleClientStatusFetch,
  updateClientFetch
} from '../../store/slices/clientSlice';
import { fetchAreas, selectAreas, selectAreasLoading } from '../../store/slices/areaSlice';
import { formatDate } from '../../utils/authUtils';
import { Badge, Button, Card, CardContent, EmptyTable, ErrorTable, LoadingTable, Pagination, SearchInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui';
import AddClientModal from './AddClientModal';

const ClientManagement = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [areaSearchTerm, setAreaSearchTerm] = useState('');
  const [debouncedAreaSearch, setDebouncedAreaSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dispatch = useDispatch();
  const clients = useSelector(selectClients);
  const pagination = useSelector(selectClientsPagination);
  const clientsLoading = useSelector(selectClientsLoading);
  const clientsError = useSelector(selectClientsError);
  const areas = useSelector(selectAreas);
  const areasLoading = useSelector(selectAreasLoading);

  // Debounced search effect
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, searchTerm]);

  // Fetch areas on component mount
  useEffect(() => {
    if (areas.length === 0) {
      dispatch(fetchAreas({ page: 1, limit: 100 }));
    }
  }, [dispatch, areas.length]);

  // Debounced search for areas
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAreaSearch(areaSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [areaSearchTerm]);

  // Filter areas based on search term and active status
  const filteredAreas = areas.filter(area => {
    // First filter by active status
    if (!area.isActive) return false;
    
    if (!debouncedAreaSearch) return true;
    const searchLower = debouncedAreaSearch.toLowerCase();
    return (
      area.name.toLowerCase().includes(searchLower) ||
      area.city.toLowerCase().includes(searchLower) ||
      area.state.toLowerCase().includes(searchLower)
    );
  });

  // Fetch clients on component mount and when search/filter changes
  useEffect(() => {
    dispatch(fetchClients({
      page: currentPage,
      search: debouncedSearchTerm,
      area: selectedAreaFilter === 'all' ? '' : selectedAreaFilter,
      status: selectedStatusFilter === 'all' ? '' : selectedStatusFilter,
      limit: 20
    }));
  }, [dispatch, currentPage, debouncedSearchTerm, selectedAreaFilter, selectedStatusFilter]);

  const handleAddClient = (clientData) => {
    // Client is already added to Redux store via createClientFetch.fulfilled
    // Just close the modal - no need to fetch again
    setIsAddModalOpen(false);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedClient(null);
  };

  const handleDeleteClient = (client) => {
    setClientToDelete(client);
  };

  const confirmDeleteClient = async () => {
    if (clientToDelete) {
      setIsDeleting(true);
      try {
        const result = await dispatch(deleteClientFetch(clientToDelete._id));
        if (deleteClientFetch.fulfilled.match(result)) {
          // Success - client deleted
          toast.success(`Client "${clientToDelete.name}" deleted successfully`);
          setClientToDelete(null);

          // Refetch clients to update the total count
          dispatch(fetchClients({
            page: currentPage,
            search: debouncedSearchTerm,
            area: selectedAreaFilter === 'all' ? '' : selectedAreaFilter,
            status: selectedStatusFilter === 'all' ? '' : selectedStatusFilter,
            limit: 20
          }));
        } else {
          // Error - show error message
          const errorMessage = result.error || 'Failed to delete client';
          toast.error(errorMessage);
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        toast.error('An unexpected error occurred while deleting the client');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const cancelDeleteClient = () => {
    setClientToDelete(null);
    setIsDeleting(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };

  const handleAreaFilterChange = (areaId) => {
    setSelectedAreaFilter(areaId);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setSelectedStatusFilter(status);
    setCurrentPage(1);
  };

  const handleClearAreaFilter = () => {
    setSelectedAreaFilter('all');
    setAreaSearchTerm('');
    setDebouncedAreaSearch('');
    setCurrentPage(1);
  };

  const handleClearStatusFilter = () => {
    setSelectedStatusFilter('all');
    setCurrentPage(1);
  };

  const handleToggleStatus = async (clientId) => {
    try {
      const result = await dispatch(toggleClientStatusFetch(clientId)).unwrap();
      toast.success(result.message);
      // No need to refetch - Redux store is already updated
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to update client status');
    }
  };

  const getStatusSwitch = (isActive, clientId) => {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={isActive}
          onCheckedChange={() => handleToggleStatus(clientId)}
          disabled={clientsLoading}
          className="data-[state=checked]:bg-green-600"
        />
        <Badge variant={isActive ? "success" : "destructive"}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      prospect: 'warning',
      customer: 'default'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="max-w-full">
      {clientsError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">
            <strong>Error:</strong> {typeof clientsError === 'string' ? clientsError : 'An error occurred'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{pagination?.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients?.filter(c => c.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive clients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients?.filter(c => !c.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={handleClearSearch}
                placeholder="Search clients..."
                loading={clientsLoading}
                searching={isSearching}
              />
              <div className="flex items-center gap-2">
                <Select
                  value={selectedAreaFilter}
                  onValueChange={handleAreaFilterChange}
                  disabled={areasLoading}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by area..." />
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
                      <SelectItem value="all">All Areas</SelectItem>
                      {filteredAreas.length > 0 ? (
                        filteredAreas.map((area) => (
                          <SelectItem key={area._id} value={area._id}>
                            {area.name} - {area.city}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-3 text-center text-sm text-gray-500">
                          {areasLoading ? 'Loading areas...' : 'No areas found'}
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
                {selectedAreaFilter && selectedAreaFilter !== 'all' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAreaFilter}
                    className="h-9 px-2"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="gradient"
              size="lg"
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Client
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto h-[410px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Table className="w-full table-fixed border-collapse">
              <TableHeader className="sticky top-0 bg-white z-30 shadow-lg border-b-2 border-gray-200">
                <TableRow className="bg-white hover:bg-white">
                  <TableHead className="w-[18%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Client</TableHead>
                  <TableHead className="w-[10%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">City</TableHead>
                  <TableHead className="w-[10%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Area</TableHead>
                  <TableHead className="w-[12%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Salesman</TableHead>
                  <TableHead className="w-[15%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Contact</TableHead>
                  <TableHead className="w-[8%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="w-[10%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Created</TableHead>
                  <TableHead className="w-[17%] bg-white border-b-0 px-4 py-3 text-right font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <LoadingTable columns={8} rows={7} className="border-0" />
                    </TableCell>
                  </TableRow>
                ) : clientsError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <ErrorTable
                        columns={8}
                        message="Failed to load clients"
                        description="There was an error loading the clients. Please try again."
                        onRetry={() => dispatch(fetchClients({
                          page: currentPage,
                          search: debouncedSearchTerm,
                          area: selectedAreaFilter === 'all' ? '' : selectedAreaFilter,
                          status: selectedStatusFilter === 'all' ? '' : selectedStatusFilter,
                          limit: 20
                        }))}
                        className="border-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : clients?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <EmptyTable
                        columns={8}
                        message={debouncedSearchTerm ? 'No clients found' : 'No clients yet'}
                        description={debouncedSearchTerm ? 'No clients match your search criteria.' : 'Create your first client to get started.'}
                        className="border-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  clients?.map((client) => (
                    <TableRow key={client._id}>
                      <TableCell className="font-medium px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {client.name}
                        </div>
                        {client.company && (
                          <div className="text-xs text-gray-500 truncate">
                            {client.company}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate">
                          {client.area?.city}
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate">
                          {client.area?.name}
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate">
                          {client.salesman ? `${client.salesman.firstName} ${client.salesman.lastName}` : 'N/A'}
                        </div>
                        {client.salesman?.email && (
                          <div className="text-xs text-gray-500 truncate">
                            {client.salesman.email}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-900 truncate">+91 {client.phone}</span>
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-900 truncate">{client.email}</span>
                          </div>
                        )}
                      </TableCell>

               

                      <TableCell className="px-4 py-3">
                        {getStatusSwitch(client.isActive, client._id)}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <span className="text-sm text-gray-900 truncate">{formatDate(client.createdAt)}</span>
                      </TableCell>

                      <TableCell className="text-right px-4 py-3">
                        <div className="flex items-center justify-end space-x-0.5">
                          {clientToDelete && clientToDelete._id === client._id ? (
                            // Show confirmation buttons
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelDeleteClient}
                                disabled={isDeleting}
                                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={confirmDeleteClient}
                                disabled={isDeleting}
                                className="h-7 px-2 text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </Button>
                            </>
                          ) : (
                            // Show normal action buttons
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClient(client)}
                                className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                                title="Edit client"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClient(client)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-900 hover:bg-red-50"
                                title="Delete client"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card className="mt-2">
          <CardContent className="p-0">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setCurrentPage}
              loading={clientsLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddClient}
      />

      {/* Edit Client Modal */}
      <AddClientModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleAddClient}
        client={selectedClient}
      />
    </div>
  );
};

export default ClientManagement;
