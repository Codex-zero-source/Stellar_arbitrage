import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TradeHistoryTable = () => {
  // Sample trade data
  const tradeData = [
    { asset: 'BTC/USDT', profit: '+0.5%', timestamp: '2025-09-05 18:30:15' },
    { asset: 'BTC/USDT', profit: '+0.2%', timestamp: '2025-09-05 18:25:41' },
    { asset: 'ETH/USDT', profit: '+0.8%', timestamp: '2025-09-05 18:20:33' },
    { asset: 'XRP/USDT', profit: '-0.1%', timestamp: '2025-09-05 18:15:27' },
  ];

  return (
    <Card className="bg-card/60 border-neon-cyan shadow-[0_0_15px_rgba(0,246,255,0.4)] backdrop-blur-sm bg-gradient-to-br from-card to-card/80">
      <CardHeader>
        <CardTitle className="text-neon-cyan font-bold uppercase text-sm tracking-wider text-glow">
          Trade History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-neon-cyan py-2">Asset</TableHead>
              <TableHead className="text-neon-cyan py-2">Profit</TableHead>
              <TableHead className="text-neon-cyan py-2">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tradeData.map((trade, index) => (
              <TableRow key={index}>
                <TableCell className="text-neon-lime">{trade.asset}</TableCell>
                <TableCell className={trade.profit.startsWith('+') ? 'text-green-400' : 'text-red-500'}>
                  {trade.profit}
                </TableCell>
                <TableCell>{trade.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TradeHistoryTable;