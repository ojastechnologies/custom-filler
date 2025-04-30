import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';

export default function AboutUs() {
  return (
    <Layout>
      <div className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">About Aero Tech Labs</h1>
            
            <div className="mb-12">
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Story</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Aero Tech Labs was founded in 2010 by a team of aerosol industry veterans with a vision to create a specialized filling facility focused on quality, precision, and customer service. What began as a small operation has grown into a respected name in the custom aerosol filling industry.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Based in South Florida, our facility combines state-of-the-art equipment with decades of collective experience to deliver exceptional aerosol products for a variety of applications. We've built our reputation on attention to detail, technical expertise, and a commitment to meeting our customers' unique requirements.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Over the years, we've expanded our capabilities to include specialized services like laser cryogen filling, becoming one of the few facilities in the country with this expertise. Today, we serve clients across various industries, from medical and cosmetic to industrial and consumer products.
                </p>
              </Card>
            </div>
            
            <div className="mb-12">
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Mission</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  At Aero Tech Labs, our mission is to provide high-quality, custom aerosol filling solutions that meet the exact specifications of our clients. We strive to be a trusted partner in product development and manufacturing, delivering consistent results with every order.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  We are committed to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Maintaining the highest standards of quality and safety in all our operations</li>
                  <li>Providing personalized service and technical support to each client</li>
                  <li>Continuously improving our processes and capabilities</li>
                  <li>Operating in an environmentally responsible manner</li>
                  <li>Building long-term relationships based on trust and reliability</li>
                </ul>
              </Card>
            </div>
            
            <div className="mb-12">
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Team</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Our team consists of experienced professionals with diverse backgrounds in chemistry, engineering, manufacturing, and quality control. With decades of combined experience in the aerosol industry, our staff brings expertise and dedication to every project.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">Photo</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">John Smith</h3>
                    <p className="text-gray-600 dark:text-gray-400">Founder & CEO</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">Photo</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sarah Johnson</h3>
                    <p className="text-gray-600 dark:text-gray-400">Technical Director</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">Photo</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Michael Chen</h3>
                    <p className="text-gray-600 dark:text-gray-400">Operations Manager</p>
                  </div>
                </div>
              </Card>
            </div>
            
            <div>
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Facility</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Located in South Florida, our 25,000 square foot facility is equipped with modern filling lines, quality control laboratories, and warehousing space. We've invested in specialized equipment for both standard aerosol filling and niche applications like laser cryogen production.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">Facility Image 1</span>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">Facility Image 2</span>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mt-6">
                  Our facility features:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Multiple filling lines for different container sizes and product types</li>
                  <li>In-house quality control and testing laboratory</li>
                  <li>Climate-controlled storage areas</li>
                  <li>Specialized equipment for laser cryogen production</li>
                  <li>Environmentally responsible waste management systems</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}