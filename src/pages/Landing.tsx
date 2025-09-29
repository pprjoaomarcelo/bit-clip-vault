import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Mail, Shield, Zap, Lock, Github, Twitter } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Secure by Design",
      description: "Never shares your private keys. Only uses wallet signatures for authentication.",
    },
    {
      icon: Zap,
      title: "Multi-Chain Support",
      description: "Automatically detects Bitcoin, Ethereum, and Solana networks from your address.",
    },
    {
      icon: Lock,
      title: "On-Chain Privacy",
      description: "View public messages or decrypt private ones. All data lives on the blockchain forever.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(17_100%_60%/0.1),transparent_50%)]" />
        
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-4">
              <Zap className="w-4 h-4" />
              <span>Decentralized Messaging Protocol</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Your On-Chain
              <span className="block bg-gradient-to-r from-primary via-orange-500 to-primary bg-clip-text text-transparent">
                Inbox
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connect your wallet to view and send messages stored permanently on Bitcoin, Ethereum, and Solana blockchains. No intermediaries, no censorship.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 text-black font-semibold text-lg px-8 shadow-lg hover:shadow-[var(--shadow-glow)] transition-all"
                onClick={() => navigate("/connect")}
              >
                <Mail className="w-5 h-5" />
                Connect Wallet
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="gap-2 text-lg px-8"
                onClick={() => navigate("/inbox")}
              >
                View Demo
              </Button>
            </div>

            <div className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Multi-chain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Open Source</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built for Crypto Natives
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A messaging platform designed with security and decentralization at its core
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-8 md:p-12 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">Security First</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Bit Clip Mail never asks for your private keys or seed phrases. 
                  Authentication is done through wallet signatures only. All messages are stored on-chain, 
                  meaning they are permanent and cannot be deleted. Use encrypted messaging for sensitive content.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Non-custodial</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Signature-based auth</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Client-side encryption</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-lg">Bit Clip Mail</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="sm" className="gap-2">
                <Github className="w-4 h-4" />
                GitHub
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Twitter className="w-4 h-4" />
                Twitter
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Built for crypto enthusiasts, developers, and content creators</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
