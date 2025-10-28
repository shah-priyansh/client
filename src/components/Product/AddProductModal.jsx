import { Package, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { createProduct, updateProduct, clearError } from '../../store/slices/productSlice';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Switch } from '../ui';

const AddProductModal = ({ isOpen, onClose, product = null, onSuccess }) => {
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      productName: '',
      isActive: true
    }
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setValue('productName', product.productName || '');
        setValue('isActive', product.isActive !== undefined ? product.isActive : true);
      } else {
        reset();
      }
    }
  }, [isOpen, product, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      if (product) {
        await dispatch(updateProduct({ id: product._id, data })).unwrap();
        toast.success('Product updated successfully');
      } else {
        await dispatch(createProduct(data)).unwrap();
        toast.success('Product created successfully');
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      toast.error(error || 'Failed to save product');
    }
  };

  const handleClose = () => {
    dispatch(clearError());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {product ? 'Update the product information' : 'Create a new product record'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Product Name *</label>
            <Input
              {...register('productName', { 
                required: 'Product name is required',
                maxLength: {
                  value: 100,
                  message: 'Product name cannot exceed 100 characters'
                }
              })}
              placeholder="Enter product name"
              className={errors.productName ? 'border-red-500' : ''}
            />
            {errors.productName && (
              <p className="text-sm text-red-500">{errors.productName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <span className="text-sm text-gray-600">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient">
              {product ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
