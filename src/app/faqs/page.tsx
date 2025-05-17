import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';

const faqs = [
  {
    question: "Are there minimum orders for contract fills?",
    answer: "Yes! In this industry 30,000 to 50,000 is what we call the “magic number”. We can't order less than 30,000 cans from our suppliers whether they're printed or unprinted. Aerosol valves are sold in minimum quantities of 50,000 as well. The components for aerosol packaging are NOT “off the shelf” items and are built by the manufacturer to your specific need at time of order. Aerosol cans, whether aluminum or steel, come in a variety of sizes & shapes, and each configuration is what makes your product unique. In order for these companies to change their tooling for your configurations they demand a minimum component run of 30-50K."
  },
  {
    question: "What can ATL do for me?",
    answer: "OOnce given the “go ahead” on your project with a purchase order, Aero Tech Labs will source your can, valve, box, actuator and other components to build your specific “turn key” product. After we become familiar with production and specification, ATL will be your one-stop-shop to keep your product manufactured and on the shelf. We are committed to the finest care for your long term filling needs."
  },
  {
    question: "Are there lead times?",
    answer: "You bet there are! We can source caps, valves, actuators, and custom printed cartons in a matter of 4 weeks, give or take some time. The main limiting factor is acquiring aerosol cans! Custom cans, and all cans are custom made at time of order as there is no inventory, now have lead times with a minimum of 12 weeks, and these lead times are capable of increasing without notice. Cans, whether they have your lithograph or plain white, are produced to your specifications only when they are requested by purchase order as dictated by ISO. Therefore, acquiring the can is a limiting factor."
  },
  {
    question: "Are aerosols hazardous?",
    answer: "According to the U.S. Department of Transportation (DOT) all aerosol products are designated with the minimum hazardous classification of ORM-D (other regulated material: Class D) and must be labeled as such on all exterior packaging and shipping documents/Bill of Lading (BOL). When aerosol products move in transit, it is the law that they be accompanied by a Material Safety Data Sheet (MSDS). So much for the bad news. Because aerosols maintain such a low order (ORM-D) of hazardous classification, generally most ground shipments will NOT require extra \"Hazardous Goods Declarations\" and will ship with just an MSDS. This makes the shipment of your end product by the case or box so much easier and simpler and a carrier like UPS or FedEx will do so for your firm once you have signed on with them as a hazardous shipper. The bottom line is that aerosol products ship under a lower hazardous designation and you can ship cases via \"Ground Parcel Carriers\" with more ease than you could any other chemical products."
  },
  {
    question: "Material Safety Data Sheet: MSDS",
    answer: "If you read \"Are Aerosols Hazardous\" above, then you must know that an MSDS is the law and must accompany your product in transit domestically & internationally. Aero Tech Labs, Inc. will not write your MSDS for you but we work with consultants who will author and validate your product's MSDS in a legally updated, validated and professional manner. The charge is very nominal and it takes a few days to acquire. We will assist you every way possible so that your finished product leaves our facility correctly saving you headaches and liability."
  },
  {
    question: "Liability of end product",
    answer: "Except in cases where the end product is 100% propellant, your formula must be submitted and validated by a chemist, consulting firm, and/or ingredient supplier that will take responsibility for their formula. Aero Tech Labs generally will not formulate your product without the help of a consultant firm that will sign off on the efficacy and stability of your end product; no exceptions. We work with a variety of formulation consultants who are exceptional in their field and will generate all the requisite data for your product. Before your product goes to market, you want to be sure that your product remains effective and stable on the store shelves. Aero Tech Labs Inc maintains a minimum amount of product liability and our insurance company dictates that \"when your label goes on the product, it is your liability and responsibility\"; no exceptions. It then becomes a requisite for the marketer to maintain their own liability insurance for their end product for this very reason. This is also why Aero Tech Labs Inc. requests that your formula be (1) formulated and signed off by an industry consultant, (2) have stability testing done on the end product, and (3) maintain liability and responsibility for their end use and marketing claims. Our insurance will only cover for our mistakes in the production of your product. All of these requirements are very small hurdles that can be handled by a consultant that will handle the formula, stability test, and MSDS and can be accomplished way before manufacturing time."
  },
  {
    question: "Toll Free Emergency Response Number",
    answer: "When your aerosol product moves in transit, the MSDS must have a Toll Free Emergency Response Number for contact by law. Aero Tech Labs does offer this service to its clientele for the cost of $ 200.00 per year per product. Your product will be registered with a hazardous materials clearing house that will answer the phone 24/7 so you won't have to."
  },
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