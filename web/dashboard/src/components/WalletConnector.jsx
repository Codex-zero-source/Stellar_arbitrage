import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';

const WalletConnector = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [walletType, setWalletType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      // Check for Freighter wallet
      if (window.freighter && await window.freighter.isConnected()) {
        const publicKey = await window.freighter.getPublicKey();
        setWalletAddress(publicKey);
        setWalletType('Freighter');
        setIsConnected(true);
        await fetchBalance(publicKey);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectFreighter = async () => {
    setIsLoading(true);
    try {
      if (!window.freighter) {
        alert('Freighter wallet not detected. Please install Freighter extension.');
        return;
      }

      const publicKey = await window.freighter.getPublicKey();
      setWalletAddress(publicKey);
      setWalletType('Freighter');
      setIsConnected(true);
      await fetchBalance(publicKey);
    } catch (error) {
      console.error('Error connecting to Freighter:', error);
      alert('Failed to connect to Freighter wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const connectAlbedo = async () => {
    setIsLoading(true);
    try {
      if (!window.albedo) {
        alert('Albedo wallet not detected. Please install Albedo extension.');
        return;
      }

      const result = await window.albedo.publicKey();
      setWalletAddress(result.pubkey);
      setWalletType('Albedo');
      setIsConnected(true);
      await fetchBalance(result.pubkey);
    } catch (error) {
      console.error('Error connecting to Albedo:', error);
      alert('Failed to connect to Albedo wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBalance = async (publicKey) => {
    try {
      // This would typically use Stellar SDK to fetch balance
      // For now, we'll simulate the balance fetch
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
      if (response.ok) {
        const accountData = await response.json();
        const xlmBalance = accountData.balances.find(b => b.asset_type === 'native');
        setBalance(xlmBalance ? parseFloat(xlmBalance.balance).toFixed(2) : '0');
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('Error');
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setWalletAddress('');
    setBalance('0');
    setWalletType('');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  if (isConnected) {
    return (
      <Card className="brutal-glass text-neon-cyan transform transition-all duration-200 hover:translate-x-1 hover:translate-y-1">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-neon-cyan font-black uppercase text-xs sm:text-sm tracking-widest text-glow flex items-center justify-between">
            <span>WALLET CONNECTED</span>
            <span className="text-neon-lime text-xs">{walletType}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          <div>
            <p className="text-xs text-neon-cyan/70 uppercase tracking-wider">ADDRESS</p>
            <p className="text-xs sm:text-sm font-bold text-neon-lime text-glow">{formatAddress(walletAddress)}</p>
          </div>
          <div>
            <p className="text-xs text-neon-cyan/70 uppercase tracking-wider">XLM BALANCE</p>
            <p className="text-base sm:text-lg font-black text-neon-lime text-glow">{balance} XLM</p>
          </div>
          <Button
            onClick={disconnect}
            variant="danger"
            size="sm"
            className="w-full text-xs py-2 sm:py-3"
          >
            DISCONNECT
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="brutal-glass text-neon-cyan">
      <CardHeader className="pb-1 sm:pb-2">
        <CardTitle className="text-neon-cyan font-black uppercase text-xs sm:text-sm tracking-widest text-glow">
          CONNECT STELLAR WALLET
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        <Button
          onClick={connectFreighter}
          disabled={isLoading}
          variant="primary"
          size="sm"
          className="w-full text-xs py-2 sm:py-3 disabled:opacity-50"
        >
          {isLoading ? 'CONNECTING...' : 'CONNECT FREIGHTER'}
        </Button>
        <Button
          onClick={connectAlbedo}
          disabled={isLoading}
          variant="secondary"
          size="sm"
          className="w-full text-xs py-2 sm:py-3 disabled:opacity-50"
        >
          {isLoading ? 'CONNECTING...' : 'CONNECT ALBEDO'}
        </Button>
        <p className="text-xs text-neon-cyan/60 text-center">
          Connect your Stellar wallet to start trading
        </p>
      </CardContent>
    </Card>
  );
};

export default WalletConnector;