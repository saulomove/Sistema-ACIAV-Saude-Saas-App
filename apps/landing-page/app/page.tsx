import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Marquee from '../components/landing/Marquee';
import Stats from '../components/landing/Stats';
import Profiles from '../components/landing/Profiles';
import Journey from '../components/landing/Journey';
import SavingsCalculator from '../components/landing/SavingsCalculator';
import Testimonials from '../components/landing/Testimonials';
import FAQ from '../components/landing/FAQ';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <div className="relative">
          <Hero />
          <Marquee />
        </div>
        <Stats />
        <Profiles />
        <Journey />
        <SavingsCalculator />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
