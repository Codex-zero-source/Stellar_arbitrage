import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { useWebSocket } from './SocketContext';

const TradeHistoryTable = () => {
  const { logs } = useWebSocket();

  // TODO: Parse trade history from logs when the format is defined
  const tradeData = [];

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
            {tradeData.length > 0 ? (
              tradeData.map((trade, index) => (
                <TableRow key={index}>
                  <TableCell className="text-neon-lime">{trade.asset}</TableCell>
                  <TableCell className={trade.profit.startsWith('+') ? 'text-green-400' : 'text-red-500'}>
                    {trade.profit}
                  </TableCell>
                  <TableCell>{trade.timestamp}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="3" className="text-center">Trade history is not yet available.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TradeHistoryTable;