import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Card from '../ui/Card';

const services = [
  {
    id: 1,
    title: "1 Inch Opening Contract Filling",
    description: "Found on a majority of aerosol products throughout the industry and is the standard for larger fill operations.",
    link: "/services/1-inch-filling"
  },
  {
    id: 2,
    title: "20 mm Opening Contract Filling",
    description: "Found on small, one piece, aluminum cans. These cans will hold anywhere from a few grams to several ounces of product.",
    link: "/services/20mm-filling"
  },
  {
    id: 3,
    title: "Non Flammable Propellant",
    description: "We fill exclusively with HFC134a and HFO1234ze, a new, low GWP, non VOC propellant.",
    link: "/services"
  },
  {
    id: 4,
    title: "Laser Cryogen",
    description: "We are the manufacturer. Buy Envirolase Cryogen Laser Coolant 1000 gram cylinders directly from us.",
    link: "/services/laser-cryogen"
  }
];

const ServicesSection = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <Card key={service.id} className="h-full flex flex-col">
              <div className="relative h-48 w-full mb-4 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold rounded-t-lg">
                {service.title}
              </div>
              <div className="p-4 flex-grow">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {service.description}
                </p>
              </div>
              <div className="p-4 pt-0 mt-auto">
                <Link 
                  href={service.link}
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Read More
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
