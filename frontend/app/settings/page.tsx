'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Package,
  DollarSign,
  MessageSquare,
  Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { productsAPI, termsAPI, smsSettingsAPI, Product, CreateProductData, Terms, CreateTermsData, SmsSettings } from '../../lib/api';

export default function Settings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [terms, setTerms] = useState<Terms[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTermsForm, setShowTermsForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingTerms, setEditingTerms] = useState<Terms | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'terms' | 'sms'>('products');
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    smsTemplate: ''
  });
  const [termsFormData, setTermsFormData] = useState<CreateTermsData>({
    name: '',
    url: ''
  });
  const [smsSettings, setSmsSettings] = useState({
    senderNumber: ''
  });

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchTerms();
      fetchSmsSettings();
    } else if (!loading) {
      // Redirect to login if not authenticated
      router.push('/');
    }
  }, [user, loading, router]);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(`Error fetching products: ${error.response?.data?.error || error.message}`);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await termsAPI.getAll();
      setTerms(response.data);
    } catch (error: any) {
      console.error('Error fetching terms:', error);
      toast.error(`Error fetching terms: ${error.response?.data?.error || error.message}`);
    }
  };

  const fetchSmsSettings = async () => {
    try {
      const response = await smsSettingsAPI.get();
      setSmsSettings(response.data);
    } catch (error: any) {
      console.error('Error fetching SMS settings:', error);
      // Don't show error toast for SMS settings as it's optional
    }
  };

  const handleSaveSmsSettings = async () => {
    try {
      await smsSettingsAPI.update(smsSettings);
      toast.success('SMS settings saved successfully');
    } catch (error: any) {
      console.error('Error saving SMS settings:', error);
      toast.error(`Error saving SMS settings: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.smsTemplate.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, formData);
        toast.success('Product updated successfully');
      } else {
        await productsAPI.create(formData);
        toast.success('Product created successfully');
      }
      
      setShowForm(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        currency: 'USD',
        smsTemplate: ''
      });
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error saving product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      currency: product.currency,
      smsTemplate: product.smsTemplate
    });
    setShowForm(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await productsAPI.delete(product.id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error deleting product');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      smsTemplate: ''
    });
  };

  const handleTermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsFormData.name.trim() || !termsFormData.url.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingTerms) {
        await termsAPI.update(editingTerms.id, termsFormData);
        toast.success('Terms updated successfully');
      } else {
        await termsAPI.create(termsFormData);
        toast.success('Terms created successfully');
      }
      
      setShowTermsForm(false);
      setEditingTerms(null);
      setTermsFormData({
        name: '',
        url: ''
      });
      fetchTerms();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error saving terms');
    }
  };

  const handleTermsEdit = (terms: Terms) => {
    setEditingTerms(terms);
    setTermsFormData({
      name: terms.name,
      url: terms.url
    });
    setShowTermsForm(true);
  };

  const handleTermsDelete = async (terms: Terms) => {
    if (!confirm(`Are you sure you want to delete "${terms.name}"?`)) {
      return;
    }

    try {
      await termsAPI.delete(terms.id);
      toast.success('Terms deleted successfully');
      fetchTerms();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error deleting terms');
    }
  };

  const handleTermsCancel = () => {
    setShowTermsForm(false);
    setEditingTerms(null);
    setTermsFormData({
      name: '',
      url: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check auth level - only authLevel 1 can access settings
  if (user && user.authLevel !== 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access settings.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Product Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="mt-4 flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'products'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('terms')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'terms'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Terms & Conditions
              </button>
              <button
                onClick={() => setActiveTab('sms')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'sms'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                SMS Settings
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>

                {showForm && (
              <div className="mb-6 p-6 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Premium Package"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price *
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="ml-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="NOK">NOK</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Brief description of the product..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMS Template *
                    </label>
                    <textarea
                      value={formData.smsTemplate}
                      onChange={(e) => setFormData({ ...formData, smsTemplate: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Hi [customer_name], your contract for [product_name] is ready. Price: [price] [currency]. Please confirm by replying YES. - [company_name]"
                      required
                    />
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="font-medium">Available placeholders:</p>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <span><code className="bg-gray-100 px-1 rounded">[price]</code> / <code className="bg-gray-100 px-1 rounded">[Price]</code> - Product price</span>
                        <span><code className="bg-gray-100 px-1 rounded">[product_name]</code> - Product name</span>
                        <span><code className="bg-gray-100 px-1 rounded">[customer_name]</code> - Customer name</span>
                        <span><code className="bg-gray-100 px-1 rounded">[company_name]</code> / <code className="bg-gray-100 px-1 rounded">[Company]</code> - Company name</span>
                        <span><code className="bg-gray-100 px-1 rounded">[orgnr]</code> / <code className="bg-gray-100 px-1 rounded">[Orgnr]</code> - Organization number</span>
                        <span><code className="bg-gray-100 px-1 rounded">[terms]</code> / <code className="bg-gray-100 px-1 rounded">[Terms]</code> - Terms URL</span>
                        <span><code className="bg-gray-100 px-1 rounded">[phone]</code> - Phone number</span>
                        <span><code className="bg-gray-100 px-1 rounded">[email]</code> - Email address</span>
                        <span><code className="bg-gray-100 px-1 rounded">[date]</code> - Current date</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingProduct ? 'Update' : 'Create'} Product</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-500">Loading products...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No products found</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first product
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>{product.price} {product.currency}</span>
                          </div>
                        </div>
                        {product.description && (
                          <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                        )}
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="flex items-center space-x-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">SMS Template:</span>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.smsTemplate}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}

            {/* Terms Tab */}
            {activeTab === 'terms' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Terms & Conditions</h3>
                  <button
                    onClick={() => setShowTermsForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Terms</span>
                  </button>
                </div>

                {showTermsForm && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {editingTerms ? 'Edit Terms' : 'Add New Terms'}
                    </h3>
                    
                    <form onSubmit={handleTermsSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Terms Name *
                        </label>
                        <input
                          type="text"
                          value={termsFormData.name}
                          onChange={(e) => setTermsFormData({ ...termsFormData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Standard Terms"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Terms URL *
                        </label>
                        <input
                          type="url"
                          value={termsFormData.url}
                          onChange={(e) => setTermsFormData({ ...termsFormData, url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com/terms"
                          required
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>{editingTerms ? 'Update' : 'Create'} Terms</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleTermsCancel}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {terms.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No terms found</p>
                    <button
                      onClick={() => setShowTermsForm(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first terms
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {terms.map((term) => (
                      <div key={term.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{term.name}</h3>
                            <a 
                              href={term.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm break-all"
                            >
                              {term.url}
                            </a>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleTermsEdit(term)}
                              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleTermsDelete(term)}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* SMS Settings Tab */}
            {activeTab === 'sms' && (
              <>
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">SMS Configuration</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sender Phone Number
                        </label>
                        <input
                          type="tel"
                          value={smsSettings.senderNumber}
                          onChange={(e) => setSmsSettings({ ...smsSettings, senderNumber: e.target.value })}
                          placeholder="+1234567890"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Enter the JustCall phone number in E.164 format that will be used to send SMS messages (e.g., +14155551234). This must be a number you own in JustCall.
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">Current sender number:</p>
                          <p className="text-gray-500">
                            {smsSettings.senderNumber || 'Not configured'}
                          </p>
                        </div>
                        <button
                          onClick={handleSaveSmsSettings}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Settings</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
