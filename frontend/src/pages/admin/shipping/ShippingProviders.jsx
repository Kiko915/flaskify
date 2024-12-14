import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ShippingProviders = () => {
  const [providers, setProviders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProvider, setEditProvider] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_default: false,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('http://localhost:5555/admin/shipping-providers', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      toast.error('Failed to fetch shipping providers');
      console.error('Error fetching providers:', error);
    }
  };

  const handleOpen = (provider = null) => {
    if (provider) {
      setEditProvider(provider);
      setFormData({
        name: provider.name,
        description: provider.description || '',
        is_active: provider.is_active,
        is_default: provider.is_default,
      });
      setLogoPreview(provider.logo_url);
    } else {
      setEditProvider(null);
      setFormData({
        name: '',
        description: '',
        is_active: true,
        is_default: false,
      });
      setLogoPreview(null);
    }
    setLogoFile(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditProvider(null);
    setFormData({
      name: '',
      description: '',
      is_active: true,
      is_default: false,
    });
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editProvider 
        ? `http://localhost:5555/admin/shipping-providers/${editProvider.provider_uuid}`
        : 'http://localhost:5555/admin/shipping-providers';

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('is_active', formData.is_active ? 'true' : 'false');
      formDataToSend.append('is_default', formData.is_default ? 'true' : 'false');
      
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }
      
      const response = await fetch(url, {
        method: editProvider ? 'PUT' : 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save provider');
        } else {
          throw new Error('Failed to save provider - Server error');
        }
      }

      toast.success(editProvider 
        ? 'Shipping provider updated successfully'
        : 'Shipping provider added successfully'
      );
      handleClose();
      fetchProviders();
    } catch (error) {
      toast.error(error.message || 'Failed to save shipping provider');
      console.error('Error saving provider:', error);
    }
  };

  const handleDelete = async (providerUuid) => {
    if (!window.confirm('Are you sure you want to delete this shipping provider?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5555/admin/shipping-providers/${providerUuid}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status !== 204) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete provider');
        }
        throw new Error('Failed to delete provider');
      }

      toast.success('Shipping provider deleted successfully');
      fetchProviders();
    } catch (error) {
      toast.error(error.message || 'Failed to delete shipping provider');
      console.error('Error deleting provider:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shipping Providers</h1>
        <button
          onClick={() => handleOpen()}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.map((provider) => (
              <tr key={provider.provider_uuid} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={provider.logo_url} alt={provider.name} />
                    <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{provider.name}</td>
                <td className="px-6 py-4">{provider.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    provider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {provider.is_active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    provider.is_default ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {provider.is_default ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleOpen(provider)}
                    className="text-yellow-600 hover:text-yellow-900 mr-3"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(provider.provider_uuid)}
                    className="text-red-600 hover:text-red-900"
                    disabled={provider.is_default}
                  >
                    <Trash2 className={`w-4 h-4 ${provider.is_default ? 'opacity-50 cursor-not-allowed' : ''}`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editProvider ? 'Edit Shipping Provider' : 'Add Shipping Provider'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="h-24 w-24 mb-2">
                  <AvatarImage src={logoPreview} alt="Preview" />
                  <AvatarFallback>
                    {formData.name ? formData.name.charAt(0) : 'L'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Label
                    htmlFor="logo-upload"
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Provider Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-8">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_active: checked }))
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_default: checked }))
                    }
                  />
                  <Label htmlFor="is_default">Default Provider</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600"
                >
                  {editProvider ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingProviders;
