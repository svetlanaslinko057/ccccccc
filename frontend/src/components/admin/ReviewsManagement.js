import React, { useState, useEffect } from 'react';
import { Trash2, Star, User, Package, Calendar, Mail, AlertCircle, Home } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../ui/button';

/**
 * Reviews Management Component for Admin Panel
 * Allows admins to view and delete product reviews
 */
const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/reviews`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Не вдалося завантажити відгуки');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей відгук?')) {
      return;
    }

    try {
      setDeleteLoading(reviewId);
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/reviews/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Відгук успішно видалено');
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error('Не вдалося видалити відгук');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggleFeatured = async (reviewId, currentFeaturedStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/reviews/${reviewId}/feature`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, featured: response.data.featured } : r
      ));
      
      toast.success(
        response.data.featured 
          ? 'Відгук додано на головну' 
          : 'Відгук прибрано з головної'
      );
    } catch (error) {
      console.error('Failed to toggle featured:', error);
      toast.error('Не вдалося оновити статус відгуку');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Управління відгуками</h2>
          <p className="text-sm text-gray-600 mt-1">
            Всього відгуків: {reviews.length}
          </p>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Відгуків поки немає
            </h3>
            <p className="text-gray-600">
              Коли користувачі залишать відгуки на товари, вони з'являться тут
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Товар
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Користувач
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Рейтинг
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Відгук
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="max-w-xs">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {review.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {review.product_id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {review.user_name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            {review.user_email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-600">
                          {review.rating}/5
                        </span>
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {review.comment}
                        </p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {formatDate(review.created_at)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleFeatured(review.id, review.featured)}
                          className={`inline-flex items-center gap-1 ${
                            review.featured
                              ? 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300 bg-green-50'
                              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200'
                          }`}
                          title={review.featured ? 'Прибрати з головної' : 'Додати на головну'}
                        >
                          <Home className="w-4 h-4" />
                          {review.featured ? '✓ На головній' : 'На головну'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(review.id)}
                          disabled={deleteLoading === review.id}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          {deleteLoading === review.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                              Видалення...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Видалити
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Середній рейтинг</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </p>
              </div>
              <Star className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Позитивні відгуки</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {reviews.filter(r => r.rating >= 4).length}
                </p>
              </div>
              <User className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Потребують уваги</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">
                  {reviews.filter(r => r.rating <= 3).length}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsManagement;
