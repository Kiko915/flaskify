import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Mail,
  Loader2,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  RefreshCcw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";

const ContactManagement = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchContacts = async () => {
    try {
      setLoading(true);
      let url = `http://localhost:5555/api/admin/contacts?page=${currentPage}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const response = await axios.get(url, { withCredentials: true });
      setContacts(response.data.contacts);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to fetch contact messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [currentPage, statusFilter]);

  const handleStatusChange = async (contactUuid, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:5555/api/admin/contacts/${contactUuid}`,
        { status: newStatus },
        { withCredentials: true }
      );
      toast.success('Status updated successfully');
      fetchContacts();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (contactUuid) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await axios.delete(
        `http://localhost:5555/api/admin/contacts/${contactUuid}`,
        { withCredentials: true }
      );
      toast.success('Message deleted successfully');
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete message');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unread':
        return 'text-yellow-500';
      case 'read':
        return 'text-blue-500';
      case 'replied':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'unread':
        return <Clock className="w-5 h-5" />;
      case 'read':
        return <CheckCircle className="w-5 h-5" />;
      case 'replied':
        return <MessageCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.subject.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <Helmet>
        <title>Contact Messages | Admin Dashboard</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Contact Messages</h1>
          <button
            onClick={fetchContacts}
            className="flex items-center gap-2 px-4 py-2 bg-[#062a51] text-white rounded-md hover:bg-[#062a51]/90"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#062a51]"
              />
            </div>
          </div>
          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#062a51]" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Found</h3>
            <p className="text-gray-500">There are no contact messages matching your criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.contact_uuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center gap-2 ${getStatusColor(contact.status)}`}>
                          {getStatusIcon(contact.status)}
                          <span className="capitalize">{contact.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{contact.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a href={`mailto:${contact.email}`} className="text-[#062a51] hover:underline">
                          {contact.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            setShowDialog(true);
                            if (contact.status === 'unread') {
                              handleStatusChange(contact.contact_uuid, 'read');
                            }
                          }}
                          className="text-[#062a51] hover:underline text-left"
                        >
                          {contact.subject}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {contact.status !== 'replied' && (
                            <button
                              onClick={() => handleStatusChange(contact.contact_uuid, 'replied')}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Mark as Replied"
                            >
                              <MessageCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(contact.contact_uuid)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete Message"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === page
                        ? 'bg-[#062a51] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message Detail Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            {selectedContact && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedContact.subject}</DialogTitle>
                  <DialogDescription>
                    From: {selectedContact.name} ({selectedContact.email})
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    Received on: {new Date(selectedContact.created_at).toLocaleString()}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ContactManagement; 