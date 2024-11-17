import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Search } from "lucide-react";
import UserDetailsDialog from "@/components/UserDetailsDialog";
import toast from 'react-hot-toast';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState('Admin');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: currentPage,
                per_page: 10,
                search: searchTerm,
                role: roleFilter === 'all' ? '' : roleFilter,
                status: statusFilter === 'all' ? '' : statusFilter,
            });

            const response = await fetch(`http://localhost:5555/admin/users?${queryParams}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            setUsers(data.users);
            setTotalPages(data.pages);
            setTotalUsers(data.total);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [currentPage, roleFilter, statusFilter]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== undefined) {
                setCurrentPage(1);
                fetchUsers();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleStatusChange = async (userId, newStatus) => {
        const toastId = toast.loading(`${newStatus === 'suspended' ? 'Suspending' : 'Activating'} user...`);
        try {
            const response = await fetch(`http://localhost:5555/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update user status');
            }

            toast.success(`User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`, { id: toastId });
            fetchUsers();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    const handleUserAction = (action, user) => {
        switch (action) {
            case 'view':
                setSelectedUserId(user.id);
                setIsDetailsDialogOpen(true);
                break;
            case 'suspend':
                handleStatusChange(user.id, 'suspended');
                break;
            case 'activate':
                handleStatusChange(user.id, 'active');
                break;
            default:
                break;
        }
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-red-100 text-red-800 hover:bg-red-200';
            case 'Seller':
                return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 hover:bg-green-200';
            case 'suspended':
                return 'bg-red-100 text-red-800 hover:bg-red-200';
            default:
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Users Management</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage and monitor user accounts
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 w-[300px]"
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Seller">Seller</SelectItem>
                            <SelectItem value="Buyer">Buyer</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="hover:bg-muted/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.profile_image} />
                                                <AvatarFallback>
                                                    {getInitials(user.first_name, user.last_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                                {user.username && <div className="text-sm text-muted-foreground">
                                                    @{user.username}
                                                </div>}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getRoleColor(user.role)}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(user.status)}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => handleUserAction('view', user)}
                                                >
                                                    View Details
                                                </DropdownMenuItem>
                                                {currentUserRole === 'Admin' && user.role !== 'Admin' && (
                                                    <>
                                                        {user.status !== 'suspended' ? (
                                                            <DropdownMenuItem
                                                                onClick={() => handleUserAction('suspend', user)}
                                                                className="text-red-600"
                                                            >
                                                                Suspend User
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => handleUserAction('activate', user)}
                                                                className="text-green-600"
                                                            >
                                                                Activate User
                                                            </DropdownMenuItem>
                                                        )}
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {users.length} of {totalUsers} users
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <UserDetailsDialog
                isOpen={isDetailsDialogOpen}
                onClose={() => {
                    setIsDetailsDialogOpen(false);
                    setSelectedUserId(null);
                }}
                userId={selectedUserId}
                currentUserRole={currentUserRole}
                onUserUpdated={fetchUsers}
            />
        </div>
    );
}
