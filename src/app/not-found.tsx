import AnimatedNotFound from '@/components/ui/AnimatedNotFound';

export default function NotFound() {
  return (
    <AnimatedNotFound
      title="Oops! Page Not Found"
      message="The page you're looking for seems to have wandered off into the digital void."
      showHomeButton={true}
    />
  );
}