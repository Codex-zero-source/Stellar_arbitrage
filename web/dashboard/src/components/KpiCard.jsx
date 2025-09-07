import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KpiCard = ({ title, value }) => (
  <Card className="bg-card/60 border-neon-cyan shadow-[0_0_15px_rgba(0,246,255,0.4)] backdrop-blur-sm bg-gradient-to-br from-card to-card/80">
    <CardHeader className="pb-2">
      <CardTitle className="text-neon-cyan font-bold uppercase text-sm tracking-wider text-glow">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-neon-lime text-glow">{value}</p>
    </CardContent>
  </Card>
);

export default KpiCard;