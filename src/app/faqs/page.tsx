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
    try {
      await addFaq(newQuestion, newAnswer);
      setFaqs(await fetchFaqs());
      setNewQuestion('');
      setNewAnswer('');
    } catch {
      setError('Failed to add FAQ.');
    }
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
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="space-y-6">
              {loading ? (
                <div>Loading...</div>
              ) : faqs.map((faq, index) => (
                <Card key={faq.id} className="overflow-hidden">
                  <div className="p-6">
                    {user && editIndex === index ? (
                      <>
                        <input
                          className="w-full mb-2 p-2 border rounded"
                          value={editQuestion}
                          onChange={e => setEditQuestion(e.target.value)}
                        />
                        <textarea
                          className="w-full mb-2 p-2 border rounded"
                          value={editAnswer}
                          onChange={e => setEditAnswer(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            className="px-4 py-1 bg-primary-600 text-white rounded"
                            onClick={() => handleSave(faq.id)}
                          >
                            Save
                          </button>
                          <button
                            className="px-4 py-1 bg-gray-300 rounded"
                            onClick={() => setEditIndex(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            onClick={() => showDeleteConfirmation(faq.id, faq.question)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          {faq.question}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {faq.answer}
                        </p>
                        {user && (
                          <div className="mt-2 flex gap-2">
                            <button
                              className="px-4 py-1 bg-primary-600 text-white rounded"
                              onClick={() => handleEdit(index)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              onClick={() => showDeleteConfirmation(faq.id, faq.question)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            {user && (
              <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded shadow">
                <h2 className="text-xl font-bold mb-2">Add New FAQ</h2>
                <input
                  className="w-full mb-2 p-2 border rounded"
                  placeholder="Question"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                />
                <textarea
                  className="w-full mb-2 p-2 border rounded"
                  placeholder="Answer"
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                />
                <button
                  className="px-6 py-2 bg-primary-600 text-white rounded"
                  onClick={handleAdd}
                >
                  Add FAQ
                </button>
              </div>
            )}
            <div className="mt-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Don't see your question here? Contact us directly and we'll be happy to help.
              </p>
              <a 
                href="/contact-us" 
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                Contact Us
              </a>
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