import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import toast from 'react-hot-toast';

export default function UserDetailsDialog({ 
    isOpen, 
    onClose, 
    userId, 
    currentUserRole,
    onUserUpdated 
}) {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserDetails();
        }
    }, [isOpen, userId]);

    const fetchUserDetails = async () => {
        try {
            const response = await fetch(`http://localhost:5555/admin/users/${userId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            setUser(data);
            setFormData(data);
        } catch (error) {
            console.error('Error fetching user details:', error);
            toast.error('Failed to load user details');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        const toastId = toast.loading('Updating user...');
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5555/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update user');
            }

            toast.success('User updated successfully', { id: toastId });
            onUserUpdated();
            setIsEditing(false);
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const canEditUser = currentUserRole === 'ADMIN' && (!user || user.role !== 'ADMIN' || user.id === userId);

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={() => {
            setIsEditing(false);
            onClose();
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit User' : 'User Details'}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                            Username
                        </Label>
                        <Input
                            id="username"
                            value={formData.username || ''}
                            className="col-span-3"
                            disabled={!isEditing}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            value={formData.email || ''}
                            className="col-span-3"
                            disabled={!isEditing}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="firstName" className="text-right">
                            First Name
                        </Label>
                        <Input
                            id="firstName"
                            value={formData.first_name || ''}
                            className="col-span-3"
                            disabled={!isEditing}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastName" className="text-right">
                            Last Name
                        </Label>
                        <Input
                            id="lastName"
                            value={formData.last_name || ''}
                            className="col-span-3"
                            disabled={!isEditing}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                            Role
                        </Label>
                        <Select
                            value={formData.role || ''}
                            onValueChange={(value) => handleInputChange('role', value)}
                            disabled={!isEditing || user.id === userId}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="SELLER">Seller</SelectItem>
                                <SelectItem value="BUYER">Buyer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    {canEditUser && !isEditing && (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                    )}
                    {isEditing && (
                        <>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setFormData(user);
                                    setIsEditing(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={loading}>
                                Save Changes
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
