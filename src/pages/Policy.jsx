import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import Seo from '../components/Seo'
import { DELIVERY_TIME, RETURN_WINDOW_DAYS, REFUND_TIME, DAMAGE_REPORT_HOURS, POLICY_UPDATED as UPDATED } from '../lib/site'

// The numbers used below (delivery time, return days...) are set in src/lib/site.js

const pages = {
  shipping: {
    title: 'Shipping and delivery',
    intro: 'How and when your order reaches you.',
    sections: [
      ['How orders are placed', ['When you place an order on the website, it is saved and WhatsApp opens with your order details. We then confirm the order, the final price and any delivery charge with you in the chat.']],
      ['Delivery time', [`Most orders are delivered in ${DELIVERY_TIME} after the order is confirmed. Some products may take longer. If so, we will tell you in the chat before you pay.`]],
      ['Delivery charges', ['Delivery charges, if any, are shared with you on WhatsApp before you make any payment. Nothing is charged on the website.']],
      ['Order status', ['You can see the current status in My Orders: Pending, Confirmed, Processing, Shipped, Delivered or Cancelled.']],
      ['Delivery address', ['Please enter a complete and correct address and a phone number we can reach. If you notice a mistake, message us on WhatsApp as soon as possible, before the order is shipped.']],
      ['Delays', ['Delays can happen because of the courier, weather or stock. We will keep you updated on WhatsApp if your order is late.']],
    ],
  },
  returns: {
    title: 'Returns and refunds',
    intro: 'What to do if something is not right.',
    sections: [
      ['Return window', [`You can ask for a return within ${RETURN_WINDOW_DAYS} days after your order is delivered.`]],
      ['What can be returned', ['Items that are unused, in their original packaging and with all parts and accessories. Items that arrive damaged, defective or different from what you ordered can always be returned.']],
      ['Damaged or wrong item', [`Message us on WhatsApp within ${DAMAGE_REPORT_HOURS} hours of delivery with your order number and clear photos of the item and the packaging. We will arrange a replacement or refund.`]],
      ['What cannot be returned', ['Items that have been used, damaged by the customer, or returned without their original packaging.']],
      ['How refunds work', [`After we receive and check the returned item, we refund you using the payment method arranged in the WhatsApp chat. This usually takes up to ${REFUND_TIME}.`]],
      ['Cancelling an order', ['You can cancel an order on WhatsApp before it is shipped. Once an order is shipped, it may not be possible to cancel it, but you can still return it under this policy.']],
    ],
  },
  privacy: {
    title: 'Privacy policy',
    intro: 'What information we collect and how we use it.',
    sections: [
      ['What we collect', [
        'Account: your name, email address and password. Your password is handled by our login provider and we cannot see it.',
        'Orders: your name, phone number, delivery address and the items you order.',
        'Reviews: your rating, your text and any photos you choose to add.',
        'Activity: basic counts such as product views, clicks and add to cart, so we know what is popular. We do not use advertising trackers.',
      ]],
      ['How we use it', ['To create your account, process and deliver your orders, contact you on WhatsApp about your order, show your wishlist, cart and orders, and improve the website.']],
      ['Who can see what', [
        'Only you can see your wishlist and cart.',
        'The store owner can see your orders and your basic account details (name and email) to manage orders.',
        'Your reviews are public. They show your first name, rating, text and photos.',
      ]],
      ['WhatsApp', ['When you place an order, we open WhatsApp with your order details. A message is only sent when you press send. WhatsApp has its own privacy rules.']],
      ['Where data is stored', ['Your data is stored with our service providers (Supabase for the database, login and file storage, and Vercel for hosting). We do not sell your personal information.']],
      ['Your choices', ['You can delete your own reviews and photos at any time. To ask for your account or data to be deleted, message us on WhatsApp.']],
      ['Children', ['This website is not meant for children under 13.']],
      ['Changes', [`We may update this policy from time to time. Last updated: ${UPDATED}.`]],
    ],
  },
  terms: {
    title: 'Terms of service',
    intro: 'The rules for using Cool Stuff.',
    sections: [
      ['About Cool Stuff', ['Cool Stuff is a product discovery website. You can browse products, save them, and place an order request. Orders are confirmed, and payment is arranged, in a WhatsApp chat. The website does not take payments.']],
      ['Your account', ['Give correct information and keep your password safe. You are responsible for what happens under your account.']],
      ['Orders and prices', [
        'Placing an order on the website is a request. It becomes confirmed when we confirm it with you on WhatsApp.',
        'Prices and availability can change. If a product is unavailable or a price is wrong, we may cancel or correct the order and tell you before you pay.',
      ]],
      ['Reviews and photos', [
        'Write honestly about your own experience. Photos must be your own and must not be offensive or show other people without permission.',
        'You allow us to show your review and photos on the website. We may remove content that breaks these rules.',
      ]],
      ['Using the website', ['Do not misuse the website, try to break it, or use it for anything illegal.']],
      ['Product information', ['We try to keep descriptions and images accurate. Colours and details may differ slightly from what you receive.']],
      ['Limits', ['To the extent allowed by law, we are not responsible for indirect losses. These terms are governed by the laws of India.']],
      ['Contact', [`Questions about these terms? Message us on WhatsApp. Last updated: ${UPDATED}.`]],
    ],
  },
}

export default function Policy() {
  const { slug } = useParams()
  const page = pages[slug]
  if (!page) {
    return <main className="px-4 pt-40"><EmptyState title="Page not found" text="This policy page does not exist." actionLabel="Back home" actionTo="/" /></main>
  }
  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 pt-32">
      <Seo title={page.title} description={page.intro} />
      <h1 className="text-center font-mono text-3xl font-bold md:text-4xl">{page.title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-ink/70">{page.intro}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {Object.entries(pages).map(([k, v]) => <Link key={k} to={`/policy/${k}`} className="chip" data-on={k === slug}>{v.title}</Link>)}
      </div>
      <div className="mt-8 space-y-4">
        {page.sections.map(([heading, paras]) => (
          <section key={heading} className="rounded-card bg-white p-6 shadow-card">
            <h2 className="font-mono font-bold">{heading}</h2>
            {paras.map((p) => <p key={p} className="mt-2 text-sm leading-relaxed text-ink/80">{p}</p>)}
          </section>
        ))}
      </div>
    </main>
  )
}