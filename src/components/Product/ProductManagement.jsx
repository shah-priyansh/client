import { Package, Edit, Trash2, Plus, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
    deleteProduct,
    fetchProducts,
    selectProducts,
    selectProductsError,
    selectProductsLoading,
    selectProductsPagination,
    setCurrentPage,
    toggleProductStatus
} from '../../store/slices/productSlice';
import { formatDate } from '../../utils/authUtils';
import {
    Badge,
    Button,
    Card,
    CardContent,
    EmptyTable,
    ErrorTable,
    LoadingTable,
    Pagination,
    SearchInput,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../ui';
import AddProductModal from './AddProductModal';

const ProductManagement = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isSearching, setIsSearching] = useState(false);

    const dispatch = useDispatch();
    const products = useSelector(selectProducts);
    const productsLoading = useSelector(selectProductsLoading);
    const productsError = useSelector(selectProductsError);
    const pagination = useSelector(selectProductsPagination);
    console.log('pagination', pagination);

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

    useEffect(() => {
        dispatch(fetchProducts({
            page: currentPage,
            search: debouncedSearchTerm,
            limit: 20
        }));
    }, [dispatch, currentPage, debouncedSearchTerm]);

    const handleAddProductSuccess = () => {
        setIsAddModalOpen(false);
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setSelectedProduct(null);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setDebouncedSearchTerm('');
        setCurrentPage(1);
    };

    const handleDeleteProduct = (product) => {
        setProductToDelete(product);
    };

    const confirmDeleteProduct = async () => {
        if (productToDelete) {
            setIsDeleting(true);
            try {
                const result = await dispatch(deleteProduct(productToDelete._id));
                if (deleteProduct.fulfilled.match(result)) {
                    // Success - product deleted
                    toast.success(`Product "${productToDelete.productName}" deleted successfully`);
                    setProductToDelete(null);
                    
                    // Refetch products to update the total count and pagination
                    dispatch(fetchProducts({
                        page: currentPage,
                        search: debouncedSearchTerm,
                        limit: 20
                    }));
                } else {
                    // Error - show error message
                    const errorMessage = result.error || 'Failed to delete product';
                    toast.error(errorMessage);
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                toast.error('An unexpected error occurred while deleting the product');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const cancelDeleteProduct = () => {
        setProductToDelete(null);
        setIsDeleting(false);
    };

    const handleToggleStatus = (productId) => {
        dispatch(toggleProductStatus(productId));
    };

    const getStatusBadge = (isActive, productId) => {
        return (
            <div className="flex items-center gap-2">
                <Switch
                    checked={isActive}
                    onCheckedChange={() => handleToggleStatus(productId)}
                    className="data-[state=checked]:bg-green-600"
                />
                <Badge variant={isActive ? "success" : "destructive"}>
                    {isActive ? 'Active' : 'Inactive'}
                </Badge>
            </div>
        );
    };
    return (
        <div className="max-w-full">

            {productsError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="text-red-800">
                        <strong>Error:</strong> {typeof productsError === 'string' ? productsError : 'An error occurred'}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900">{pagination.totalItems}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Products</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {products.filter(p => p.isActive).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Inactive Products</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {products.filter(p => !p.isActive).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-6">
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            onClear={handleClearSearch}
                            placeholder="Search products..."
                            loading={productsLoading}
                            searching={isSearching}
                        />
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            variant="gradient"
                            size="lg"
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Add Product
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
                                    <TableHead className="w-[40%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Product Name</TableHead>
                                    <TableHead className="w-[15%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Status</TableHead>
                                    <TableHead className="w-[20%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Created</TableHead>
                                    <TableHead className="w-[20%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Updated</TableHead>
                                    <TableHead className="w-[15%] bg-white border-b-0 px-4 py-3 text-right font-semibold text-gray-900">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="p-0">
                                            <LoadingTable columns={5} rows={7} className="border-0" />
                                        </TableCell>
                                    </TableRow>
                                ) : productsError ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="p-0">
                                            <ErrorTable
                                                columns={5}
                                                message="Failed to load products"
                                                description="There was an error loading the products. Please try again."
                                                onRetry={() => dispatch(fetchProducts({ page: currentPage, search: debouncedSearchTerm, limit: 20 }))}
                                                className="border-0"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="p-0">
                                            <EmptyTable
                                                columns={5}
                                                message={debouncedSearchTerm ? 'No products found' : 'No products yet'}
                                                description={debouncedSearchTerm ? 'No products match your search criteria.' : 'Create your first product to get started.'}
                                                className="border-0"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product) => (
                                        <TableRow key={product._id}>
                                            <TableCell className="font-medium px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {product.productName}
                                                </div>
                                            </TableCell>

                                            <TableCell className="px-4 py-3">
                                                {getStatusBadge(product.isActive, product._id)}
                                            </TableCell>

                                            <TableCell className="px-4 py-3">
                                                <span className="text-sm text-gray-900 truncate">{formatDate(product.createdAt)}</span>
                                            </TableCell>

                                            <TableCell className="px-4 py-3">
                                                <span className="text-sm text-gray-900 truncate">{formatDate(product.updatedAt)}</span>
                                            </TableCell>

                                            <TableCell className="text-right px-4 py-3">
                                                <div className="flex items-center justify-end space-x-0.5">
                                                    {productToDelete && productToDelete._id === product._id ? (
                                                        // Show confirmation buttons
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={cancelDeleteProduct}
                                                                disabled={isDeleting}
                                                                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={confirmDeleteProduct}
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
                                                                onClick={() => handleEditProduct(product)}
                                                                className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                                                                title="Edit product"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteProduct(product)}
                                                                className="h-7 w-7 p-0 text-red-600 hover:text-red-900 hover:bg-red-50"
                                                                title="Delete product"
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

            {pagination.totalPages > 1 && (
                <Card className="mt-2">
                    <CardContent className="p-0">
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            total={pagination.totalItems}
                            limit={pagination.itemsPerPage}
                            onPageChange={setCurrentPage}
                            loading={productsLoading}
                        />
                    </CardContent>
                </Card>
            )}

            <AddProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleAddProductSuccess}
            />

            <AddProductModal
                isOpen={isEditModalOpen}
                onClose={handleEditModalClose}
                onSuccess={handleAddProductSuccess}
                product={selectedProduct}
            />

        </div>
    );
};

export default ProductManagement;
