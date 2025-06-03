'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { fetchFaqs, updateFaq, addFaq, deleteFaq, FAQ } from '@/services/faqsService';

export default function FAQsPage() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    faqId: string;
    faqQuestion: string;
  }>({
    show: false,
    faqId: '',
    faqQuestion: ''
  });

  useEffect(() => {
    const loadFaqs = async () => {
      setLoading(true);
      try {
        setFaqs(await fetchFaqs());
      } catch {
        setError('Failed to load FAQs.');
      } finally {
        setLoading(false);
      }
    };
    loadFaqs();
  }, []);

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setEditQuestion(faqs[index].question);
    setEditAnswer(faqs[index].answer);
  };

  const handleSave = async (id: string) => {
    try {
      await updateFaq(id, editQuestion, editAnswer);
      setFaqs(faqs.map((faq, i) => i === editIndex ? { ...faq, question: editQuestion, answer: editAnswer } : faq));
      setEditIndex(null);
    } catch {
      setError('Failed to update FAQ.');
    }
  };

  const handleAdd = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      setError('Please fill in both question and answer.');
      return;
    }

    setAdding(true);
    try {
      await addFaq(newQuestion, newAnswer);
      setFaqs(await fetchFaqs());
      setNewQuestion('');
      setNewAnswer('');
      setShowAddForm(false);
      setError(null);
    } catch {
      setError('Failed to add FAQ.');
    } finally {
      setAdding(false);
    }
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    setNewQuestion('');
    setNewAnswer('');
    setError(null);
  };

  const showDeleteConfirmation = (id: string, question: string) => {
    setDeleteConfirm({
      show: true,
      faqId: id,
      faqQuestion: question
    });
  };

  const hideDeleteConfirmation = () => {
    setDeleteConfirm({
      show: false,
      faqId: '',
      faqQuestion: ''
    });
  };

  const handleDelete = async () => {
    try {
      await deleteFaq(deleteConfirm.faqId);
      setFaqs(faqs.filter(faq => faq.id !== deleteConfirm.faqId));
      hideDeleteConfirmation();
    } catch {
      setError('Failed to delete FAQ.');
      hideDeleteConfirmation();
    }
  };

  return (
    <Layout>
      <div className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h1>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading FAQs...</span>
                </div>
              ) : faqs.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No FAQs available yet.</p>
                  {user && (
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Click "Add New FAQ" below to get started.</p>
                  )}
                </div>
              ) : (
                faqs.map((faq, index) => (
                  <Card key={faq.id} className="overflow-hidden">
                    <div className="p-6">
                      {user && editIndex === index ? (
                        <>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Question
                            </label>
                            <input
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              value={editQuestion}
                              onChange={e => setEditQuestion(e.target.value)}
                              placeholder="Enter the question..."
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Answer
                            </label>
                            <textarea
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                              rows={4}
                              value={editAnswer}
                              onChange={e => setEditAnswer(e.target.value)}
                              placeholder="Enter the answer..."
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                              onClick={() => handleSave(faq.id)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Save
                            </button>
                            <button
                              className="flex items-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
                              onClick={() => setEditIndex(null)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel
                            </button>
                            <button
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                              onClick={() => showDeleteConfirmation(faq.id, faq.question)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            {faq.question}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {faq.answer}
                          </p>
                          {user && (
                            <div className="mt-4 flex gap-2">
                              <button
                                className="flex items-center gap-2 px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors text-sm font-medium"
                                onClick={() => handleEdit(index)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium"
                                onClick={() => showDeleteConfirmation(faq.id, faq.question)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Add New FAQ Section */}
            {user && (
              <div className="mt-8">
                {!showAddForm ? (
                  <div className="text-center">
                    <button
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                      onClick={() => setShowAddForm(true)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add New FAQ
                    </button>
                  </div>
                ) : (
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-primary-200 dark:border-primary-800">
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Add New FAQ
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Question
                          </label>
                          <input
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter the question..."
                            value={newQuestion}
                            onChange={e => setNewQuestion(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Answer
                          </label>
                          <textarea
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            rows={4}
                            placeholder="Enter the answer..."
                            value={newAnswer}
                            onChange={e => setNewAnswer(e.target.value)}
                          />
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                          <button
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                            onClick={handleAdd}
                            disabled={adding || !newQuestion.trim() || !newAnswer.trim()}
                          >
                            {adding ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Adding...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Add FAQ
                              </>
                            )}
                          </button>
                          <button
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 dark:from-gray-600 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                            onClick={cancelAdd}
                            disabled={adding}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Contact Section */}
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Still Have Questions?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Don't see your question here? Contact us directly and we'll be happy to help.
                </p>
                <a 
                  href="/contact-us" 
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete FAQ
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  Are you sure you want to delete this FAQ?
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border-l-4 border-red-400">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Question:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {deleteConfirm.faqQuestion}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                  onClick={hideDeleteConfirmation}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                  onClick={handleDelete}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}