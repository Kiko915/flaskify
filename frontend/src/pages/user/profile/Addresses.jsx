import { useState, useEffect, useRef } from 'react';
import { Plus, MapPin, Home, Building2, Trash2, Edit, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from 'react-hot-toast';
import UserCard from '@/components/user/UserCard';
import Alert from '@/components/feedback/Alert';
import { Helmet } from 'react-helmet-async';
import FMap from '@/components/misc/Map';
import { Map, Marker, ZoomControl } from "pigeon-maps";


const AddressForm = ({ onClose, onSubmit, editingAddress = null }) => {
  const [formData, setFormData] = useState({
    address_name: '',
    recipient_name: '',
    phone_number: '',
    country: '',
    province: '',
    city: '',
    postal_code: '',
    complete_address: '',
    additional_info: '',
    is_default_shipping: false,
    is_default_billing: false
  });

  const [position, setPosition] = useState([50.879, 4.6997]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (editingAddress) {
      setFormData(editingAddress);
      if (editingAddress.latitude && editingAddress.longitude) {
        setPosition([editingAddress.latitude, editingAddress.longitude]);
      }
    }

    // Add click outside listener
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingAddress]);

  const handleMapClick = async ({ latLng }) => {
    setPosition(latLng);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latLng[0]}&lon=${latLng[1]}&format=json`
      );
      const data = await response.json();
      
      if (data.address) {
        setFormData(prev => ({
          ...prev,
          country: data.address.country || '',
          province: data.address.state || '',
          city: data.address.city || data.address.town || '',
          postal_code: data.address.postcode || '',
          complete_address: data.display_name || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching address details:', error);
    }
  };

  const handleAddressSearch = async (searchText) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setFormData(prev => ({ ...prev, complete_address: searchText }));

    if (searchText.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchTimeout(
      setTimeout(async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&limit=5`
          );
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      }, 300)
    );
  };

  const handleSuggestionSelect = async (suggestion) => {
    const newPosition = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    setPosition(newPosition);
    setShowSuggestions(false);

    try {
      const detailsResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${newPosition[0]}&lon=${newPosition[1]}&format=json`
      );
      const details = await detailsResponse.json();

      if (details.address) {
        setFormData(prev => ({
          ...prev,
          country: details.address.country || '',
          province: details.address.state || '',
          city: details.address.city || details.address.town || '',
          postal_code: details.address.postcode || '',
          complete_address: suggestion.display_name,
        }));
      }
    } catch (error) {
      console.error('Error fetching address details:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      latitude: position[0],
      longitude: position[1]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address_name">Address Name</Label>
          <Input
            id="address_name"
            placeholder="e.g., Home, Office"
            value={formData.address_name}
            onChange={e => setFormData({ ...formData, address_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipient_name">Recipient Name</Label>
          <Input
            id="recipient_name"
            value={formData.recipient_name}
            onChange={e => setFormData({ ...formData, recipient_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          type="tel"
          value={formData.phone_number}
          onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2 relative">
        <Label htmlFor="complete_address">Search Address</Label>
        <Input
          id="complete_address"
          placeholder="Type to search address..."
          value={formData.complete_address}
          onChange={e => handleAddressSearch(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          required
        />
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-10 w-full bg-white shadow-lg rounded-md mt-1 border border-gray-200 max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                {suggestion.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
        <Map 
          height={300} 
          center={position} 
          zoom={11} 
          onClick={handleMapClick}
        >
          <ZoomControl />
          <Marker width={50} anchor={position} />
        </Map>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={e => setFormData({ ...formData, country: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="province">Province</Label>
          <Input
            id="province"
            value={formData.province}
            onChange={e => setFormData({ ...formData, province: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional_info">Additional Information</Label>
        <Textarea
          id="additional_info"
          placeholder="Delivery instructions, landmarks, etc."
          value={formData.additional_info}
          onChange={e => setFormData({ ...formData, additional_info: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Address Type</Label>
        <RadioGroup
          defaultValue={formData.is_default_shipping ? "shipping" : formData.is_default_billing ? "billing" : "normal"}
          onValueChange={value => {
            setFormData({
              ...formData,
              is_default_shipping: value === "shipping",
              is_default_billing: value === "billing"
            });
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="normal" id="normal" />
            <Label htmlFor="normal">Normal Address</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="shipping" id="shipping" />
            <Label htmlFor="shipping">Default Shipping Address</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="billing" id="billing" />
            <Label htmlFor="billing">Default Billing Address</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600">
          {editingAddress ? 'Update Address' : 'Add Address'}
        </Button>
      </div>
    </form>
  );
};



const AddressCard = ({ address, onEdit, onDelete, onSetActive }) => {
  return (
    <Card className={address.is_active ? 'border-yellow-500' : undefined}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-full">
              {address.address_name.toLowerCase().includes('home') ? (
                <Home className="w-4 h-4 text-primary" />
              ) : (
                <Building2 className="w-4 h-4 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-medium">{address.address_name}</h3>
              <p className="text-sm text-muted-foreground">{address.recipient_name}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(address)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(address.address_uuid)}>
              <Trash2 className="w-4 h-4" />
            </Button>
            {!address.is_active && (
              <Button variant="ghost" size="icon" onClick={() => onSetActive(address.address_uuid)}>
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-sm">{address.complete_address}</p>
          <p className="text-sm text-muted-foreground">{address.phone_number}</p>
          {address.additional_info && (
            <p className="text-sm text-muted-foreground">Note: {address.additional_info}</p>
          )}
          <div className="flex space-x-2">
            {address.is_default_shipping && (
              <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                Default Shipping
              </span>
            )}
            {address.is_default_billing && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">
                Default Billing
              </span>
            )}
            {address.is_active && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                Active
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export default function Addresses() {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('http://localhost:5555/api/addresses', { credentials: 'include' }); 
      const data = await response.json();
      setAddresses(data);
    } catch (error) {
      toast.error('Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (formData) => {
    try {
      const url = editingAddress
        ? `http://localhost:5555/api/addresses/${editingAddress.address_uuid}`
        : 'http://localhost:5555/api/addresses';

      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to save address');

      toast.success('Address saved successfully');

      setShowAddressForm(false);
      setEditingAddress(null);
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleDelete = async (addressUuid) => {
    try {
      const response = await fetch(`http://localhost:5555/api/addresses/${addressUuid}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete address');

      toast.success('Address deleted successfully');

      fetchAddresses();
    } catch (error) {
      console.log(error);
      toast.error(error.message || 'Failed to delete address');
    }
  };

  const handleSetActive = async (addressUuid) => {
    try {
      const response = await fetch(`http://localhost:5555/api/addresses/${addressUuid}/set-active`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to set active address');

      toast.success('Address set as active successfully');

      fetchAddresses();
    } catch (error) {
      toast.error('Failed to set active address');
    }
  };

  return (
    <>
    <Helmet>
      <title>Addresses - My Account</title>
    </Helmet>
    <UserCard title='Manage Addresses' short_description='Manage your addresses'>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Addresses</CardTitle>
        <Button className="bg-yellow-500 hover:bg-yellow-600" onClick={() => setShowAddressForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Address
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : addresses.length === 0 ? (
          <Alert type="warning" title="Add complete address" message="you do not have any addresses yet." />
        ) : (
          <div className="grid gap-4">
            {addresses.map(address => (
              <AddressCard
                key={address.address_uuid}
                address={address}
                onEdit={(addr) => {
                  setEditingAddress(addr);
                  setShowAddressForm(true);
                }}
                onDelete={handleDelete}
                onSetActive={handleSetActive}
              />
            ))}
          </div>
        )}

        <Dialog
          open={showAddressForm}
          onOpenChange={setShowAddressForm}

        >
          <DialogContent className="max-w-2xl max-h-screen overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
              <DialogDescription>
                {editingAddress ? 'Update the address details' : 'Fill in the details to add a new address'}
              </DialogDescription>
            </DialogHeader>
            <AddressForm
              onClose={() => {
                setShowAddressForm(false);
                setEditingAddress(null);
              }}
              onSubmit={handleAddressSubmit}
              editingAddress={editingAddress}
              initialValues={editingAddress}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    </UserCard>
    </>
  );
}



