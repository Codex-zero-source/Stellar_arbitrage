import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Badge, 
  Input, 
  Label, 
  Progress, 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from './ui';

const UIShowcase = () => {
  const [inputValue, setInputValue] = useState('');
  const [progress, setProgress] = useState(65);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <Card variant="glass" className="mb-6">
        <CardHeader>
          <CardTitle className="text-center">
            🎨 NEOBRUTALISM + GLASSMORPHISM UI LIBRARY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-xs sm:text-sm opacity-80 font-bold uppercase tracking-wide">
            Reusable components for the Arbitrage Dashboard
          </p>
        </CardContent>
      </Card>

      {/* Buttons Section */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>BUTTONS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button variant="default" size="sm">Default</Button>
            <Button variant="primary" size="sm">Primary</Button>
            <Button variant="secondary" size="sm">Secondary</Button>
            <Button variant="success" size="sm">Success</Button>
            <Button variant="danger" size="sm">Danger</Button>
            <Button variant="ghost" size="sm">Ghost</Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card variant="default">
          <CardHeader>
            <CardTitle>Default Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs opacity-80">Standard Neobrutalism card with lime borders</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Glass Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs opacity-80">Glassmorphism effect with backdrop blur</p>
          </CardContent>
        </Card>

        <Card variant="cyan">
          <CardHeader>
            <CardTitle>Cyan Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs opacity-80">Cyan themed variant</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges Section */}
      <Card variant="magenta">
        <CardHeader>
          <CardTitle>BADGES</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="glass">Glass</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge size="sm">Small</Badge>
            <Badge size="default">Default</Badge>
            <Badge size="lg">Large</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Forms Section */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>FORM ELEMENTS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="default-input">Default Input</Label>
              <Input 
                id="default-input"
                placeholder="Enter value..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="glass-input">Glass Input</Label>
              <Input 
                id="glass-input"
                variant="glass"
                placeholder="Glass effect..."
              />
            </div>
            <div>
              <Label htmlFor="cyan-input">Cyan Input</Label>
              <Input 
                id="cyan-input"
                variant="cyan"
                placeholder="Cyan themed..."
              />
            </div>
            <div>
              <Label htmlFor="magenta-input">Magenta Input</Label>
              <Input 
                id="magenta-input"
                variant="magenta"
                placeholder="Magenta themed..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      <Card variant="yellow">
        <CardHeader>
          <CardTitle>PROGRESS BARS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Default Progress ({progress}%)</Label>
              <Progress value={progress} showValue />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-10%</Button>
                <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+10%</Button>
              </div>
            </div>
            <div>
              <Label>Glass Progress</Label>
              <Progress variant="glass" value={80} />
            </div>
            <div>
              <Label>Warning Progress</Label>
              <Progress variant="warning" value={45} size="lg" />
            </div>
            <div>
              <Label>Danger Progress</Label>
              <Progress variant="danger" value={25} size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Alert variant="success">
          <AlertTitle>Success Alert</AlertTitle>
          <AlertDescription>
            Your arbitrage trade was executed successfully!
          </AlertDescription>
        </Alert>

        <Alert variant="warning">
          <AlertTitle>Warning Alert</AlertTitle>
          <AlertDescription>
            High volatility detected in the market.
          </AlertDescription>
        </Alert>

        <Alert variant="danger">
          <AlertTitle>Danger Alert</AlertTitle>
          <AlertDescription>
            Insufficient balance for trade execution.
          </AlertDescription>
        </Alert>

        <Alert variant="glass">
          <AlertTitle>Glass Alert</AlertTitle>
          <AlertDescription>
            New arbitrage opportunity detected.
          </AlertDescription>
        </Alert>
      </div>

      {/* Interactive Demo */}
      <Card variant="glass" className="border-4 border-neon-lime">
        <CardHeader>
          <CardTitle className="text-center">🚀 INTERACTIVE DEMO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-xs sm:text-sm opacity-80 font-bold uppercase tracking-wide">
              All components are fully responsive and touch-friendly
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="success">Mobile Ready</Badge>
              <Badge variant="info">Accessible</Badge>
              <Badge variant="glass">Modern Design</Badge>
            </div>
            <Button variant="primary" size="lg" className="animate-pulse">
              START TRADING
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UIShowcase;