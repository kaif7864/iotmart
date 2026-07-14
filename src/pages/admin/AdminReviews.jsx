import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api.client';
import { Star, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/common/EmptyState';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await apiClient.get('/products?limit=1000');
      const allProducts = res.data.products || res.data;
      
      let allReviews = [];
      allProducts.forEach(product => {
        if (product.reviews && product.reviews.length > 0) {
          product.reviews.forEach((review, index) => {
            allReviews.push({
              ...review,
              product_id: product._id,
              product_name: product.name,
              review_index: index
            });
          });
        }
      });
      
      allReviews.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setReviews(allReviews);
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, reviewIndex) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    
    try {
      await apiClient.delete(`/products/${productId}/reviews/${reviewIndex}`);
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  if (loading) return <div className="p-8 text-text-primary font-bold text-xl">Loading reviews...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-border-main">
        <div>
          <p className="label-caps text-accent mb-2">Community</p>
          <h1 className="heading-page">Review <span className="text-accent">Moderation</span></h1>
          <p className="text-text-muted mt-2 font-medium">Monitor and manage customer feedback</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reviews.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No Reviews Found" description="Your products haven't received any reviews yet." />
        ) : (
          reviews.map((review, idx) => (
            <div key={`${review.product_id}-${idx}`} className="card rounded-2xl p-6 border-l-4 border-l-accent hover:border-l-accent-light transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-bold text-text-primary text-lg">{review.user_name || 'Anonymous User'}</span>
                    {review.verified_buyer && (
                      <span className="px-2 py-0.5 text-[10px] font-black bg-status-success-bg text-status-success rounded-sm uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-text-muted">
                    Product: <span className="text-accent font-medium">{review.product_name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                  <div className="flex items-center text-status-warning">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-border-main'}`} />
                    ))}
                  </div>
                  <button 
                    onClick={() => handleDelete(review.product_id, review.review_index)}
                    className="p-3 bg-status-danger-bg text-status-danger hover:bg-status-danger hover:text-white rounded-xl transition-colors shrink-0"
                    title="Delete Review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-app-bg p-4 rounded-xl border border-border-main">
                <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">{review.comment || 'No comment provided.'}</p>
                {review.date && (
                  <p className="text-[10px] text-text-muted mt-3 font-bold uppercase tracking-widest">
                    {new Date(review.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
