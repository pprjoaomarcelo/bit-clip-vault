import React from 'react';
import { Navbar } from "@/components/Navbar";

const UpgradePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar connected={false} address="" onConnect={() => {}} onDisconnect={() => {}} />
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">Upgrade Your Plan</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Choose a plan that fits your needs and unlock more features.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <div className="border rounded-lg p-6 flex flex-col">
            <h2 className="text-2xl font-semibold">Basic</h2>
            <p className="text-muted-foreground mt-2">For individuals and small teams</p>
            <p className="text-4xl font-bold my-4">$0<span className="text-lg font-normal text-muted-foreground">/month</span></p>
            <ul className="space-y-2 mb-6">
              <li>✔️ 1 GB Storage</li>
              <li>✔️ Basic Support</li>
              <li>✔️ Limited Analytics</li>
            </ul>
            <button className="mt-auto w-full bg-gray-200 text-gray-800 py-2 rounded">
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-primary rounded-lg p-6 flex flex-col relative">
            <div className="absolute top-0 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <h2 className="text-2xl font-semibold">Pro</h2>
            <p className="text-muted-foreground mt-2">For growing businesses</p>
            <p className="text-4xl font-bold my-4">$25<span className="text-lg font-normal text-muted-foreground">/month</span></p>
            <ul className="space-y-2 mb-6">
              <li>✔️ 10 GB Storage</li>
              <li>✔️ Priority Support</li>
              <li>✔️ Advanced Analytics</li>
              <li>✔️ API Access</li>
            </ul>
            <button className="mt-auto w-full bg-primary text-primary-foreground py-2 rounded">
              Upgrade to Pro
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="border rounded-lg p-6 flex flex-col">
            <h2 className="text-2xl font-semibold">Enterprise</h2>
            <p className="text-muted-foreground mt-2">For large-scale applications</p>
            <p className="text-4xl font-bold my-4">Contact Us</p>
            <ul className="space-y-2 mb-6">
              <li>✔️ Unlimited Storage</li>
              <li>✔️ Dedicated Support</li>
              <li>✔️ Custom Integrations</li>
              <li>✔️ On-premise option</li>
            </ul>
            <button className="mt-auto w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground py-2 rounded">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
