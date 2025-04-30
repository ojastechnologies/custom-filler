const testimonials = [
    {
      id: 1,
      content: "Aero Tech Labs has been our trusted partner for laser cryogen products for over 5 years. Their quality and consistency are unmatched in the industry.",
      author: "Dr. Sarah Johnson",
      title: "Dermatologist, Johnson Skin Clinic"
    },
    {
      id: 2,
      content: "Working with Aero Tech Labs has streamlined our product development process. Their technical expertise and attention to detail have been invaluable.",
      author: "Michael Chen",
      title: "Product Manager, BeautyTech Innovations"
    },
    {
      id: 3,
      content: "The custom filling solutions provided by Aero Tech Labs have allowed us to bring unique products to market that set us apart from competitors.",
      author: "Lisa Rodriguez",
      title: "CEO, Aerosol Innovations"
    }
  ];
  
  const TestimonialsSection = () => {
    return (
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">What Our Clients Say</h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We take pride in our work and the relationships we build with our clients
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              >
                <svg className="h-8 w-8 text-primary-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{testimonial.content}</p>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{testimonial.author}</p>
                  <p className="text-gray-500 dark:text-gray-500">{testimonial.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };
  
  export default TestimonialsSection;
