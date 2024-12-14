import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ShippingRates = () => {
  const [rates, setRates] = useState([]);
  const [providers, setProviders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editRate, setEditRate] = useState(null);
  const [formData, setFormData] = useState({
    provider_uuid: '',
    name: '',
    description: '',
    base_rate: '',
    weight_rate: '',
    min_weight: '0',
    max_weight: '',
    estimated_days: '',
    is_active: true,
  });

  useEffect(() => {
    fetchProviders();
    fetchRates();
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

  const fetchRates = async () => {
    try {
      const response = await fetch('http://localhost:5555/admin/shipping-rates', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch rates');
      const data = await response.json();
      setRates(data);
    } catch (error) {
      toast.error('Failed to fetch shipping rates');
      console.error('Error fetching rates:', error);
    }
  };

  const handleOpen = (rate = null) => {
    if (rate) {
      setEditRate(rate);
      setFormData({
        provider_uuid: rate.provider_uuid,
        name: rate.name,
        description: rate.description || '',
        base_rate: rate.base_rate.toString(),
        weight_rate: rate.weight_rate.toString(),
        min_weight: rate.min_weight?.toString() || '0',
        max_weight: rate.max_weight?.toString() || '',
        estimated_days: rate.estimated_days?.toString() || '',
        is_active: rate.is_active,
      });
    } else {
      setEditRate(null);
      setFormData({
        provider_uuid: '',
        name: '',
        description: '',
        base_rate: '',
        weight_rate: '',
        min_weight: '0',
        max_weight: '',
        estimated_days: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditRate(null);
    setFormData({
      provider_uuid: '',
      name: '',
      description: '',
      base_rate: '',
      weight_rate: '',
      min_weight: '0',
      max_weight: '',
      estimated_days: '',
      is_active: true,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.provider_uuid) {
      toast.error('Please select a shipping provider');
      return;
    }
    if (!formData.name || !formData.base_rate || !formData.weight_rate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const url = editRate 
        ? `http://localhost:5555/admin/shipping-rates/${editRate.rate_uuid}`
        : `http://localhost:5555/admin/shipping-providers/${formData.provider_uuid}/rates`;
        
      const response = await fetch(url, {
        method: editRate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          base_rate: parseFloat(formData.base_rate),
          weight_rate: parseFloat(formData.weight_rate),
          min_weight: formData.min_weight ? parseFloat(formData.min_weight) : 0,
          max_weight: formData.max_weight ? parseFloat(formData.max_weight) : null,
          estimated_days: formData.estimated_days ? parseInt(formData.estimated_days) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save rate');
      }

      toast.success(editRate 
        ? 'Shipping rate updated successfully'
        : 'Shipping rate added successfully'
      );
      handleClose();
      fetchRates();
    } catch (error) {
      toast.error(error.message || 'Failed to save shipping rate');
      console.error('Error saving rate:', error);
    }
  };

  const handleDelete = async (rateUuid) => {
    if (!window.confirm('Are you sure you want to delete this shipping rate?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5555/admin/shipping-rates/${rateUuid}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete rate');
      }

      toast.success('Shipping rate deleted successfully');
      fetchRates();
    } catch (error) {
      toast.error(error.message || 'Failed to delete shipping rate');
      console.error('Error deleting rate:', error);
    }
  };

  const getProviderName = (providerUuid) => {
    const provider = providers.find(p => p.provider_uuid === providerUuid);
    return provider ? provider.name : 'Unknown Provider';
  };

  // Add a formatter for Philippine Peso
  const formatPeso = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shipping Rates</h1>
        <Button onClick={() => handleOpen()} variant="default" className="bg-yellow-500 hover:bg-yellow-600">
          <Plus className="w-4 h-4 mr-2" /> Add Rate
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Base Rate</TableHead>
              <TableHead>Weight Rate</TableHead>
              <TableHead>Weight Range</TableHead>
              <TableHead>Est. Days</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((rate) => (
              <TableRow key={rate.rate_uuid}>
                <TableCell>{getProviderName(rate.provider_uuid)}</TableCell>
                <TableCell>{rate.name}</TableCell>
                <TableCell>{formatPeso(rate.base_rate)}</TableCell>
                <TableCell>{formatPeso(rate.weight_rate)}/kg</TableCell>
                <TableCell>
                  {rate.min_weight || 0}kg - {rate.max_weight ? `${rate.max_weight}kg` : 'No limit'}
                </TableCell>
                <TableCell>
                  {rate.estimated_days ? `${rate.estimated_days} days` : 'N/A'}
                </TableCell>
                <TableCell className="text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    rate.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {rate.is_active ? 'Yes' : 'No'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => handleOpen(rate)}
                    variant="ghost"
                    size="icon"
                    className="text-yellow-600 hover:text-yellow-900 mr-2"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(rate.rate_uuid)}
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editRate ? 'Edit Shipping Rate' : 'Add Shipping Rate'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider_uuid">Shipping Provider</Label>
              <Select
                name="provider_uuid"
                value={formData.provider_uuid}
                onValueChange={(value) => handleInputChange({ target: { name: 'provider_uuid', value } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.provider_uuid} value={provider.provider_uuid}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Rate Name</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_rate">Base Rate (₱)</Label>
                <Input
                  type="number"
                  step="0.01"
                  id="base_rate"
                  name="base_rate"
                  value={formData.base_rate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight_rate">Rate per kg (₱)</Label>
                <Input
                  type="number"
                  step="0.01"
                  id="weight_rate"
                  name="weight_rate"
                  value={formData.weight_rate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_weight">Min Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  id="min_weight"
                  name="min_weight"
                  value={formData.min_weight}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_weight">Max Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  id="max_weight"
                  name="max_weight"
                  value={formData.max_weight}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_days">Estimated Days</Label>
              <Input
                type="number"
                id="estimated_days"
                name="estimated_days"
                value={formData.estimated_days}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  handleInputChange({ target: { name: 'is_active', type: 'checkbox', checked } })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600">
                {editRate ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShippingRates; 