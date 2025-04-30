import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';

const faqs = [
  {
    question: "What types of aerosol products can you fill?",
    answer: "We specialize in filling a wide range of aerosol products, including but not limited to personal care products, household cleaners, industrial solutions, and medical-grade products like laser cryogen. Our facility is equipped to handle both water-based and solvent-based formulations."
  },
  {
    question: "What is the minimum order quantity?",
    answer: "Our minimum order quantity varies depending on the product type and complexity. For standard products, we typically require a minimum of 5,000 units, while specialized products like laser cryogen may have different requirements. Please contact us for specific information about your product."
  },
  {
    question: "Can you help with product formulation?",
    answer: "Yes, our team includes experienced chemists who can help develop or refine your product formulation. We offer formulation services to ensure your product meets your specifications and performs as expected."
  },
  {
    question: "What is the turnaround time for orders?",
    answer: "Turnaround time depends on various factors including order size, product complexity, and our current production schedule. Typically, standard orders are completed within 4-6 weeks from approval of the final formulation and receipt of all components."
  },
  {
    question: "Do you provide packaging and labeling services?",
    answer: "Yes, we offer comprehensive packaging and labeling services. We can source containers, valves, and actuators, and we have the capability to apply labels according to your specifications and regulatory requirements."
  },
  {
    question: "What safety standards do you follow?",
    answer: "We adhere to strict safety standards in all our operations. Our facility complies with all relevant regulations for aerosol manufacturing, including OSHA requirements, EPA guidelines, and industry best practices for handling pressurized products."
  },
  {
    question: "What is laser cryogen and what is it used for?",
    answer: "Laser cryogen is a specialized cooling spray used during laser treatments in dermatology and aesthetic procedures. It helps protect the epidermis (outer skin layer) from thermal damage during laser treatments by cooling the skin surface rapidly. Our laser cryogen products are formulated specifically for medical applications and meet stringent quality standards."
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we can ship internationally, though additional regulations and shipping requirements may apply for aerosol products. We work with experienced logistics partners who specialize in handling and shipping aerosol products globally in compliance with international shipping regulations."
  },
  {
    question: "Can you accommodate rush orders?",
    answer: "We do our best to accommodate rush orders when our production schedule allows. Please contact us directly to discuss your timeline requirements, and we'll work with you to find a solution."
  },
  {
    question: "What information do you need to provide a quote?",
    answer: "To provide an accurate quote, we typically need information about the product type, formulation details (if available), container specifications, valve type, actuator type, fill weight, order quantity, and any special requirements such as custom labeling or packaging. The more details you can provide, the more precise our quote will be."
  }
];

export default function FAQsPage() {
  return (
    <Layout>
      <div className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h1>
            
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
            
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
    </Layout>
  );
}