import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api.client';
import { Mail, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/common/EmptyState';

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await apiClient.get('/support');
        setTickets(res.data);
      } catch (error) {
        toast.error('Failed to load support tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleResolve = async (id) => {
    try {
      await apiClient.put(`/support/${id}/resolve`);
      toast.success('Ticket marked as resolved');
      setTickets(tickets.map(t => t._id === id ? { ...t, status: 'Resolved' } : t));
    } catch (error) {
      toast.error('Failed to resolve ticket');
    }
  };

  if (loading) return <div className="p-8 text-text-primary font-bold text-xl">Loading tickets...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-border-main">
        <div>
          <p className="label-caps text-accent mb-2">Customer Service</p>
          <h1 className="heading-page">Support <span className="text-accent">Tickets</span></h1>
          <p className="text-text-muted mt-2 font-medium">Manage customer inquiries and order disputes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tickets.length === 0 ? (
          <EmptyState icon={Mail} title="No Tickets Found" description="Inbox is zero! Great job." />
        ) : (
          tickets.map((ticket) => (
            <div key={ticket._id} className={`card rounded-2xl p-6 border-l-4 ${ticket.status === 'Resolved' ? 'border-l-status-success' : 'border-l-status-warning'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-text-primary text-lg">{ticket.subject || 'General Inquiry'}</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-sm uppercase tracking-wider ${
                      ticket.status === 'Resolved' 
                        ? 'bg-status-success-bg text-status-success' 
                        : 'bg-status-warning-bg text-status-warning'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="text-sm text-text-muted flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {ticket.email || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                    {ticket.order_id && (
                      <span className="flex items-center gap-1 text-accent"><AlertCircle className="h-3 w-3" /> Order: {ticket.order_id}</span>
                    )}
                  </div>
                </div>
                {ticket.status !== 'Resolved' && (
                  <button 
                    onClick={() => handleResolve(ticket._id)}
                    className="btn-premium px-6 py-2 text-xs flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center"
                  >
                    <CheckCircle className="h-4 w-4" /> Resolve
                  </button>
                )}
              </div>
              <div className="bg-app-bg p-4 rounded-xl border border-border-main mt-4">
                <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
