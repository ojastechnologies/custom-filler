'use client';

import { useState, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ContactUs() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const iframe = document.createElement('iframe');
    iframe.name = 'form-target';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const form = formRef.current as HTMLFormElement;
    form.target = 'form-target';
    form.action = 'https://formsubmit.co/aerosol@comcast.net';
    form.method = 'POST';
    form.submit();

    setTimeout(() => {
      setIsSubmitted(true);
      setIsSubmitting(false);

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 1500);
  };
  
  const resetForm = () => {
    setIsSubmitted(false);
    setFormValues({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: ''
    });
  };
  
  return (
    <Layout>
      <div className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Contact Us</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Card className="p-6 h-full">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Get in Touch</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Have questions about our services or want to request a quote? Fill out the form and our team will get back to you as soon as possible.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <svg className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Location</h3>
                        <p className="text-gray-600 dark:text-gray-400">728 N. W. 7th Terrace</p>
                        <p className='text-gray-600 dark:text-gray-400'>Fort Lauderdale, FL 33311</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <svg className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Phone</h3>
                        <p className="text-gray-600 dark:text-gray-400"> 954-463-4584</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              
              <div>
                <Card className="p-6">
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <svg className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Thank You!</h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Your message has been sent successfully. We&apos;ll get back to you soon.
                      </p>
                      <Button 
                        variant="primary" 
                        className="mt-6"
                        onClick={resetForm}
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form 
                      ref={formRef}
                      onSubmit={handleSubmit}
                    >
                      <input type="hidden" name="_subject" value="New Contact Form Submission" />
                      <input type="hidden" name="_captcha" value="false" />
                      <input type="hidden" name="_template" value="table" />
                      <input type="hidden" name="_next" value="false" />
                      <input type="text" name="_honey" style={{ display: 'none' }} />
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formValues.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formValues.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formValues.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Company
                          </label>
                          <input
                            type="text"
                            id="company"
                            name="company"
                            value={formValues.company}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Message *
                          </label>
                          <textarea
                            id="message"
                            name="message"
                            value={formValues.message}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          ></textarea>
                        </div>
                        
                        <div>
                          <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}