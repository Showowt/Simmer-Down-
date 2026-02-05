import Link from 'next/link'
import { ArrowRight, Truck, Clock, Star } from 'lucide-react'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent z-10" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Pizza &<br />
            <span className="text-orange-400">Good Vibes</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-lg">
            Handcrafted pizzas made with love in El Salvador.
            Fresh ingredients, authentic flavors.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/menu"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-semibold flex items-center gap-2 transition"
            >
              Order Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/menu"
              className="border-2 border-white hover:bg-white hover:text-black text-white px-8 py-4 rounded-full font-semibold transition"
            >
              View Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="font-bold text-xl mb-2">Fast Delivery</h3>
              <p className="text-gray-500">Hot pizza delivered to your door in 30-45 minutes</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="font-bold text-xl mb-2">Quality Ingredients</h3>
              <p className="text-gray-500">Fresh, locally-sourced ingredients in every pizza</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="font-bold text-xl mb-2">Easy Ordering</h3>
              <p className="text-gray-500">Order online anytime, pickup or delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Hungry? We Got You.
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Browse our menu and order your favorite pizza today.
            Delivery and pickup available.
          </p>
          <Link
            href="/menu"
            className="inline-block bg-black hover:bg-gray-900 text-white px-10 py-4 rounded-full font-semibold text-lg transition"
          >
            Start Your Order
          </Link>
        </div>
      </section>
    </div>
  )
}
