import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Mail,
  Loader2,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCcw,
  Send
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";

const NewsletterManagement = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailContent, setEmailContent] = useState({
    subject: '',
    message: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5555/api/admin/newsletter/subscribers?page=${currentPage}`,
        { withCredentials: true }
      );
      setSubscribers(response.data.subscribers);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to fetch newsletter subscribers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [currentPage]);

  const handleDelete = async (email) => {
    if (!window.confirm('Are you sure you want to remove this subscriber?')) return;

    try {
      await axios.delete(
        `http://localhost:5555/api/admin/newsletter/subscribers/${email}`,
        { withCredentials: true }
      );
      toast.success('Subscriber removed successfully');
      fetchSubscribers();
    } catch (error) {
      console.error('Error removing subscriber:', error);
      toast.error('Failed to remove subscriber');
    }
  };

  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    if (!emailContent.subject || !emailContent.message) {
      toast.error('Please fill in both subject and message');
      return;
    }

    try {
      setSendingEmail(true);
      await axios.post(
        'http://localhost:5555/api/admin/newsletter/send',
        emailContent,
        { withCredentials: true }
      );
      toast.success('Newsletter sent successfully');
      setShowDialog(false);
      setEmailContent({ subject: '', message: '' });
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast.error('Failed to send newsletter');
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    if (!searchQuery) return true;
    return subscriber.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <Helmet>
        <title>Newsletter Management | Admin Dashboard</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Newsletter Management</h1>
          <div className="flex gap-2">
            <button
              onClick={fetchSubscribers}
              className="flex items-center gap-2 px-4 py-2 bg-[#062a51] text-white rounded-md hover:bg-[#062a51]/90"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-[#062a51] rounded-md hover:bg-[#FFD700]/90"
            >
              <Send className="w-4 h-4" />
              Send Newsletter
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#062a51]"
            />
          </div>
        </div>

        {/* Subscribers List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#062a51]" />
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscribers Found</h3>
            <p className="text-gray-500">There are no newsletter subscribers matching your criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`mailto:${subscriber.email}`} className="text-[#062a51] hover:underline">
                        {subscriber.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm ${
                        subscriber.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {subscriber.is_active ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {subscriber.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(subscriber.subscribed_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(subscriber.email)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Remove Subscriber"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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

        {/* Send Newsletter Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Newsletter</DialogTitle>
              <DialogDescription>
                Compose and send a newsletter to all active subscribers
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendNewsletter} className="space-y-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={emailContent.subject}
                  onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#062a51]"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  value={emailContent.message}
                  onChange={(e) => setEmailContent({ ...emailContent, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#062a51]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-[#062a51] text-white rounded-md hover:bg-[#062a51]/90 disabled:opacity-50"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Newsletter
                    </>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default NewsletterManagement; 