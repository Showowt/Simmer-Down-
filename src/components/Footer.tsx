import { Instagram, Facebook, Phone, MapPin, Clock } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-3xl">🍕</span>
              <span className="font-bold text-xl">SIMMER DOWN</span>
            </div>
            <p className="text-gray-400">Pizza & Good Vibes</p>
            <p className="text-gray-400 mt-2">El Salvador</p>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              Hours
            </h3>
            <div className="text-gray-400 space-y-1">
              <p>Mon - Thu: 11am - 10pm</p>
              <p>Fri - Sat: 11am - 11pm</p>
              <p>Sunday: 12pm - 9pm</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <div className="text-gray-400 space-y-2">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-400" />
                +503 XXXX-XXXX
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                San Salvador, El Salvador
              </p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-orange-400 transition">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition">
                <Facebook className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Simmer Down. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
