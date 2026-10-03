// ============================================================
// Curated real Google reviews — social proof for the reviews carousel.
//
// These are authentic Google reviews (shown WITH Google attribution). They are
// displayed as testimonials only. We deliberately do NOT emit Review /
// AggregateRating structured data for them: Google's structured-data policy
// requires review markup to be first-party (collected by this site), and
// marking up third-party/Google reviews risks a manual action. The real
// ranking signals live in the Google Business Profile + the Restaurant schema
// in src/lib/seo/structured-data.ts.
// ============================================================

export interface CuratedReview {
  author: string
  /** Quote as published on Google (already English where Google translated it). */
  text: string
  location: 'Santa Ana' | 'San Benito' | 'Sivar'
  /** English relative time, as Google shows it; the carousel localizes it. */
  time: string
  rating: 5
}

export const CURATED_REVIEWS: CuratedReview[] = [
  {
    author: 'Andrew Parkinson',
    text: "Wow, I'm blown away — best steak ever. Perfection in every way.",
    location: 'Santa Ana',
    time: '7 months ago',
    rating: 5,
  },
  {
    author: 'Ana Chelsea Smith',
    text: 'This place is a must — their Loroka pizza is sooo good! The drinks, the service, the food — everything was outstanding. Would highly recommend.',
    location: 'Santa Ana',
    time: '4 months ago',
    rating: 5,
  },
  {
    author: 'D GO',
    text: 'Looks touristy and overpriced, but it is the opposite! The pizzas were delicious — cooked crust, fresh toppings and great combinations. You can even choose two halves.',
    location: 'Santa Ana',
    time: '10 months ago',
    rating: 5,
  },
  {
    author: 'Chanel Varasteh',
    text: 'Such an incredible restaurant — amazing views of the town square and cathedral, and the food is really delicious! Perfect stop after the cathedral and during sunset.',
    location: 'Santa Ana',
    time: '5 months ago',
    rating: 5,
  },
  {
    author: 'Charity Hagenaars',
    text: 'The server Mármol and chef Diego were amazing. Best steak in El Salvador — and better than The Keg in Canada!!',
    location: 'Santa Ana',
    time: 'a month ago',
    rating: 5,
  },
  {
    author: 'Rgrzzly_ghost',
    text: 'They specialize in pizza and you can taste it — thin dough, cheesy cheese, and generous toppings. I recommend the pepperoni and loroco cheese pizza!',
    location: 'San Benito',
    time: '2 years ago',
    rating: 5,
  },
  {
    author: 'Jose Francisco Martinez',
    text: "I came for the Deftones show and they've gained another regular: super special service, delicious food, affordable prices, and above all, great atmosphere and music.",
    location: 'San Benito',
    time: 'a year ago',
    rating: 5,
  },
  {
    author: 'Krystal Monzon',
    text: 'Incredible food, outstanding service, and an elegant atmosphere. Every dish was perfectly prepared — truly a five-star dining experience.',
    location: 'Santa Ana',
    time: '2 months ago',
    rating: 5,
  },
  {
    author: 'T Pappas',
    text: 'Stopped here two nights in a row — the food was absolutely excellent. The view upstairs looks right out at the cathedral. A fun environment with great music.',
    location: 'Santa Ana',
    time: '8 months ago',
    rating: 5,
  },
  {
    author: 'Carolina Bran',
    text: 'The pizza was delicious! They offered a 50/50 — prosciutto on one half, mushrooms and chimichurri on the other, both delicious. Highly recommended for gourmet pizza.',
    location: 'San Benito',
    time: '2 years ago',
    rating: 5,
  },
  {
    author: 'Rik Radikal',
    text: 'Pet-friendly, live music, best entertainment all around. Best pizza ever! Staff and management have the best customer service. Loved it!',
    location: 'San Benito',
    time: '3 years ago',
    rating: 5,
  },
  {
    author: 'Monica MacConnell',
    text: 'The pizza is superb — fresh and made with quality ingredients. Sit upstairs for a beautiful view of the church and theater. The staff is exceptional.',
    location: 'Santa Ana',
    time: '9 months ago',
    rating: 5,
  },
  {
    author: 'Promptus Data',
    text: 'Top location next to the beautiful cathedral, with an upper terrace and a nice view. The food is very nice and the service perfect. One of the best places we visited!',
    location: 'Santa Ana',
    time: '3 years ago',
    rating: 5,
  },
  {
    author: 'Bennett G',
    text: 'The waiters were really cool, the view was great, and the $20 steak and shrimp was awesome — the filet is wrapped in bacon.',
    location: 'Santa Ana',
    time: 'a month ago',
    rating: 5,
  },
  {
    author: 'Camila Ventoza',
    text: 'Lovely and peaceful, perfect for dinner with friends. The drinks are excellent and freshly made, and the pizza is superb — fresh, quality ingredients.',
    location: 'San Benito',
    time: 'a year ago',
    rating: 5,
  },
  {
    author: 'Jim Platner',
    text: 'Great pizza and craft beer bar on the square in Santa Ana! Good food, cold beer, quick service, and an amazing spot to watch the world go by. A highlight of our visit!',
    location: 'Santa Ana',
    time: '4 years ago',
    rating: 5,
  },
  {
    author: 'Fabio Marroquin',
    text: 'Excellent, super friendly staff with great menu knowledge, and super fast service. Fridays and Saturdays have live music and events. Great flavors!',
    location: 'San Benito',
    time: '3 years ago',
    rating: 5,
  },
  {
    author: 'Kameron Ackermann',
    text: "Rarely do I give five stars, but this place is definitely worth it. It's large, so expect a wait on weekends — but it's worth every minute.",
    location: 'Santa Ana',
    time: '4 years ago',
    rating: 5,
  },
  {
    author: 'Hamish Derrick',
    text: 'Pizza is great, very welcoming for tourists and locals alike! David was great fun and incredibly kind and helpful. Would return in a heartbeat.',
    location: 'Santa Ana',
    time: '4 weeks ago',
    rating: 5,
  },
  {
    author: 'Raul Santana',
    text: 'The food was delicious, the staff very friendly. We had the house specialty and it was delicious — plentiful portions with great flavor.',
    location: 'Santa Ana',
    time: 'a year ago',
    rating: 5,
  },
]
