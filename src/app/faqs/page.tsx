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

  const handleDelete = async (id: string) => {
    try {
      await deleteFaq(id);
      setFaqs(faqs.filter(faq => faq.id !== id));
    } catch {
      setError('Failed to delete FAQ.');
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
                            className="px-4 py-1 bg-red-600 text-white rounded"
                            onClick={() => handleDelete(faq.id)}
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
                              className="px-4 py-1 bg-red-600 text-white rounded"
                              onClick={() => handleDelete(faq.id)}
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
                Don&apos;t see your question here? Contact us directly and we&apos;ll be happy to help.
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
    </Layout>
  );
}