import { MessageSquare, Upload, X, Play, Pause, Trash2, Mic, MicOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { addFeedbackFetch, updateFeedbackFetch, generateSignedUrlFetch, uploadAudioToS3, selectSignedUrl, selectUploadSuccess } from '../../store/slices/feedbackSlice';
import { fetchClients, selectClients, selectClientsLoading } from '../../store/slices/clientSlice';
import { fetchProducts, selectProducts, selectProductsLoading } from '../../store/slices/productSlice';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, Badge } from '../ui';
const AddFeedbackModal = ({ isOpen, onClose, feedback = null }) => {
  const dispatch = useDispatch();
  const [selectedClient, setSelectedClient] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      client: '',
      lead: 'Green',
      notes: '',
      audio: null
    }
  });

  // Redux selectors
  const clients = useSelector(selectClients);
  const clientsLoading = useSelector(selectClientsLoading);
  const products = useSelector(selectProducts);
  const productsLoading = useSelector(selectProductsLoading);
  const signedUrl = useSelector(selectSignedUrl);
  const uploadSuccess = useSelector(selectUploadSuccess);

  // Watch form values
  const watchedValues = watch();

  // Debug clients loading and set client when clients are loaded
  useEffect(() => {
    console.log('Clients loaded:', clients, 'Loading:', clientsLoading);
    
    // Set client selection after clients are loaded
    if (feedback && clients.length > 0 && !clientsLoading) {
      console.log('Inquiries client object:', feedback.client);
      const clientId = feedback.client?._id || '';
      console.log('Setting client after clients loaded:', clientId, 'Available clients:', clients.map(c => ({ id: c._id, name: c.name })));
      setSelectedClient(clientId);
      setValue('client', clientId);
    }
  }, [clients, clientsLoading, feedback, setValue]);

  // Set products when feedback is loaded
  useEffect(() => {
    if (feedback && feedback.products && Array.isArray(feedback.products)) {
      // Transform products to match the expected format
      const transformedProducts = feedback.products.map(productItem => ({
        product: productItem.product?._id || productItem.product || '',
        quantity: productItem.quantity || 1
      }));
      setSelectedProducts(transformedProducts);
    }
  }, [feedback]);

  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, fetching clients and products...');
      dispatch(fetchClients());
      dispatch(fetchProducts({ isActive: true }));

      if (feedback) {
        console.log('Setting feedback data:', feedback);
        setValue('lead', feedback.lead || 'Green');
        setValue('notes', feedback.notes || '');

        // Set products for existing feedback
        if (feedback.products && Array.isArray(feedback.products)) {
          // Transform products to match the expected format
          const transformedProducts = feedback.products.map(productItem => ({
            product: productItem.product?._id || productItem.product || '',
            quantity: productItem.quantity || 1
          }));
          setSelectedProducts(transformedProducts);
        }

        // Set audio data for existing feedback
        if (feedback.audio?.key) {
          console.log('Setting existing audio:', feedback.audio);
          setValue('audio', {
            key: feedback.audio.key,
            originalName: feedback.audio.originalName || 'existing-audio'
          });
          setAudioUrl('existing-audio'); // Set a flag to show audio exists
        }
      } else {
        reset();
        setSelectedClient('');
        setSelectedProducts([]);
        setAudioFile(null);
        setAudioUrl(null);
        setAudioBlob(null);
      }
    }
  }, [isOpen, feedback, dispatch, setValue, reset]);

  const handleClientChange = (clientId) => {
    console.log('Client changed to:', clientId);
    setSelectedClient(clientId);
    setValue('client', clientId);
  };

  const handleLeadChange = (lead) => {
    setValue('lead', lead);
  };

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, { product: '', quantity: 1 }]);
  };

  const removeProduct = (index) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index, field, value) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedProducts(updated);
  };

  const getLeadBadgeVariant = (lead) => {
    switch (lead) {
      case 'Red': return 'destructive';
      case 'Green': return 'default';
      case 'Orange': return 'secondary';
      default: return 'outline';
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        setAudioBlob(file);

        // Auto-upload to AWS
        try {
          setIsUploading(true);
          const audioData = await handleAudioUpload(file);
          setValue('audio', audioData);
          toast.success('Audio uploaded successfully');
        } catch (error) {
          toast.error('Failed to upload audio');
          console.error('Upload error:', error);
        } finally {
          setIsUploading(false);
        }
      } else {
        toast.error('Please select an audio file');
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const audioFile = new File([blob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(audioFile);
        stream.getTracks().forEach(track => track.stop());

        // Auto-upload to AWS
        try {
          setIsUploading(true);
          const audioData = await handleAudioUpload(audioFile);
          setValue('audio', audioData);
          toast.success('Audio recorded and uploaded successfully');
        } catch (error) {
          toast.error('Failed to upload recorded audio');
          console.error('Upload error:', error);
        } finally {
          setIsUploading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      toast.error('Failed to start recording');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const playAudio = async () => {
    // Don't play if audioUrl is just a flag for existing audio
    if (audioUrl === 'existing-audio') {
      toast.error('Cannot play existing audio in edit mode. Use the play button in the Inquiries list.');
      return;
    }

    if (audioUrl && audioUrl !== 'existing-audio') {
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
        setIsPlaying(false);
      } else {
        try {
          const audio = new Audio(audioUrl);
          audio.onended = () => {
            setIsPlaying(false);
            setAudioElement(null);
          };
          await audio.play();
          setAudioElement(audio);
          setIsPlaying(true);
        } catch (error) {
          console.error('Audio play error:', error);
          toast.error('Failed to play audio: ' + error.message);
        }
      }
    }
  };

  const removeAudio = () => {
    setAudioFile(null);
    setAudioUrl(null);
    setAudioBlob(null);
    setValue('audio', null);
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setIsPlaying(false);
    }
  };

  const handleAudioUpload = async (file) => {
    try {
      setIsUploading(true);

      // Step 1: Get signed URL
      const signedUrlResult = await dispatch(generateSignedUrlFetch({ 
        fileName: file.name, 
        fileType: file.type 
      })).unwrap();

      if (!signedUrlResult) {
        throw new Error('Failed to get signed URL');
      }

      const { signedUrl: uploadUrl, key } = signedUrlResult;

      // Step 2: Upload to S3
      const uploadResult = await dispatch(uploadAudioToS3({ 
        file, 
        signedUrl: uploadUrl 
      })).unwrap();

      if (!uploadResult.success) {
        throw new Error('Failed to upload audio');
      }

      return { key, originalName: file.name };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Validate products
      if (selectedProducts.length === 0) {
        toast.error('Please add at least one product');
        return;
      }

      const validProducts = selectedProducts.filter(p => p.product && p.quantity > 0);
      if (validProducts.length === 0) {
        toast.error('Please select valid products with quantities');
        return;
      }

      const feedbackData = {
        ...data,
        client: selectedClient,
        products: validProducts.map(p => ({
          product: p.product,
          quantity: parseInt(p.quantity)
        })),
        audio: data.audio || null
      };

      if (feedback) {
        await dispatch(updateFeedbackFetch({ id: feedback._id, data: feedbackData })).unwrap();
        toast.success('Inquiries updated successfully');
      } else {
        await dispatch(addFeedbackFetch(feedbackData)).unwrap();
        toast.success('Inquiries created successfully');
      }

      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save Inquiries');
    }
  };

  const handleClose = () => {
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setIsPlaying(false);
    }
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {feedback ? 'Edit Inquiries' : 'Add New Inquiries'}
          </DialogTitle>
          <DialogDescription>
            {feedback ? 'Update the Inquiries information' : 'Create a new client Inquiries record'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Client *</label>
              <Select value={selectedClient} onValueChange={handleClientChange}>
                <SelectTrigger className={errors.client ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clientsLoading ? (
                    <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                  ) : clients.length === 0 ? (
                    <SelectItem value="no-clients" disabled>No clients available</SelectItem>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name} - {client.phone}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.client && (
                <p className="text-sm text-red-500">{errors.client.message}</p>
              )}
            </div>

            {/* Lead Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lead Status *</label>
              <Select value={watchedValues.lead} onValueChange={handleLeadChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Red">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Red</Badge>
                      <span>High Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Orange">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Orange</Badge>
                      <span>Medium Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Green">
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Green</Badge>
                      <span>Low Priority</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Products *</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProduct}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Add Product
              </Button>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No products selected</p>
                <p className="text-sm">Click "Add Product" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedProducts.map((productItem, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Product</label>
                        <Select
                          value={productItem.product}
                          onValueChange={(value) => updateProduct(index, 'product', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {productsLoading ? (
                              <SelectItem value="loading" disabled>Loading products...</SelectItem>
                            ) : products.length === 0 ? (
                              <SelectItem value="no-products" disabled>No products available</SelectItem>
                            ) : (
                              products.map((product) => (
                                <SelectItem key={product._id} value={product._id}>
                                  {product.productName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Quantity</label>
                        <Input
                          type="number"
                          min="1"
                          value={productItem.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-red-500 hover:text-red-700 h-9 w-9 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <Textarea
              {...register('notes')}
              placeholder="Enter additional notes..."
              rows={3}
            />
          </div>

          {/* Audio Recording Section */}
          <div className="space-y-4 border-t pt-4">
            <label className="text-sm font-medium text-gray-700">Audio Recording</label>

            <div className="space-y-3">
              {/* Audio Controls */}
              <div className="flex items-center gap-3">
                {!audioUrl ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={isRecording ? stopRecording : startRecording}
                      className="flex items-center gap-2"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          Start Recording
                        </>
                      )}
                    </Button>

                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    {audioUrl !== 'existing-audio' && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={playAudio}
                        className="flex items-center gap-2"
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        {isPlaying ? 'Pause' : 'Play'} Audio
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={removeAudio}
                      className="flex items-center gap-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {(audioUrl || watchedValues.audio) &&audioUrl !== 'existing-audio' && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      Uploading audio to AWS...
                    </div>
                  ) : watchedValues.audio ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {audioUrl === 'existing-audio' ? '' : 'Audio uploaded successfully'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Audio ready for upload
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !selectedClient || selectedProducts.length === 0}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {audioUrl ? 'Uploading Audio...' : 'Saving...'}
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  {feedback ? 'Update Inquiries' : 'Create Inquiries'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFeedbackModal;