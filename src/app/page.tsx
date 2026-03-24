import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, Settings, BarChart3, Database } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: LayoutGrid,
      title: "Drag & Drop Interface",
      description: "Easily rearrange widgets with intuitive drag-and-drop",
    },
    {
      icon: Settings,
      title: "Fully Customizable",
      description: "Configure widgets, adjust sizes, and customize metrics",
    },
    {
      icon: BarChart3,
      title: "Multiple Visualizations",
      description: "Tables, charts, cards, stats, and data feeds",
    },
    {
      icon: Database,
      title: "Data Driven",
      description: "Works with any database schema",
    },
  ];

  return (
    <main className="min-h-screen bg-linear-to-br from-background to-secondary/20">
      <header className="border-b border-border/50 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-6 h-6" />
              <span className="font-semibold text-lg">Dashboard Hub</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Features
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-20">
        <section className="text-center mb-20">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Dynamic Dashboard
            </span>
            <br />
            <span className="text-foreground">Your Data, Your Way</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A fully customizable dashboard platform that adapts to your database
            schema. Create stunning visualizations, analyze data, and make
            informed decisions with ease.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              <LayoutGrid className="w-5 h-5" />
              Launch Dashboard
            </Button>
          </Link>
        </section>

        <section id="features" className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="border-border/50 hover:border-primary/50 transition-colors"
                >
                  <CardHeader>
                    <Icon className="w-10 h-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="bg-muted/50 border border-border/50 rounded-lg p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Access your dynamic dashboard with pre-configured widgets and full
            customization capabilities.
          </p>
          <Link href="/dashboard">
            <Button className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
