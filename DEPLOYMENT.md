# Arbitrage DApp Deployment Guide

This guide covers multiple deployment options for the Stellar Arbitrage DApp, including Render.com, Docker, and local development.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git
- Stellar account with testnet/mainnet access
- Reflector Oracle API key

## 📋 Environment Setup

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd Arbitrage
```

### 2. Backend Configuration
```bash
cd web/dashboard/backend
cp .env.example .env
# Edit .env with your actual values
```

### 3. Frontend Configuration
```bash
cd ../
npm install
```

## 🌐 Render.com Deployment (Recommended)

### Prerequisites
- Render.com account
- GitHub repository with your code

### Steps

1. **Connect Repository**
   - Fork/push this repository to GitHub
   - Connect your GitHub account to Render

2. **Deploy Using render.yaml**
   - Render will automatically detect the `render.yaml` file
   - Services will be created automatically:
     - `arbitrage-frontend` (Static Site)
     - `arbitrage-backend` (Web Service)
     - `arbitrage-worker` (Background Worker)
     - `arbitrage-db` (PostgreSQL Database)

3. **Configure Environment Variables**
   Set these in Render dashboard:
   ```
   ARBITRAGE_DETECTOR_CONTRACT_ID=your_contract_id
   REFLECTOR_ORACLE_CONTRACT_ID=your_oracle_id
   TRADING_ENGINE_CONTRACT_ID=your_trading_id
   FLASH_LOAN_ENGINE_CONTRACT_ID=your_flash_loan_id
   REFLECTOR_API_KEY=your_reflector_api_key
   ALERT_EMAIL=your_email@example.com
   WEBHOOK_URL=your_slack_webhook_url
   ```

4. **Deploy**
   - Push to main branch
   - Render will automatically build and deploy
   - Frontend: `https://your-app.onrender.com`
   - Backend: `https://your-api.onrender.com`

### Render Configuration Details

- **Frontend**: Static site with automatic HTTPS
- **Backend**: Python web service with WebSocket support
- **Database**: PostgreSQL with automatic backups
- **Worker**: Background process for arbitrage scanning
- **Auto-scaling**: Enabled for production workloads

## 🐳 Docker Deployment

### Local Development with Docker

```bash
# Build and start all services
docker-compose up --build

# Services available at:
# Frontend: http://localhost:5173
# Backend: http://localhost:8768
# Database: localhost:5432
# Redis: localhost:6379
```

### Production Docker Deployment

```bash
# Build production image
docker build -t arbitrage-app .

# Run with environment file
docker run -d \
  --name arbitrage-app \
  --env-file .env \
  -p 8768:8768 \
  arbitrage-app
```

### Docker Compose Production

```bash
# Use production profile
docker-compose --profile production up -d

# This includes:
# - Nginx reverse proxy
# - PostgreSQL database
# - Redis cache
# - Backend service
```

## 💻 Local Development

### Backend Setup
```bash
cd web/dashboard/backend
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd web/dashboard
npm install
npm run dev
```

### Services
- Frontend: http://localhost:5173
- Backend WebSocket: ws://localhost:8768
- Backend API: http://localhost:8768

## 🔧 Configuration

### Environment Variables

#### Required Variables
```env
# Stellar Network
STELLAR_NETWORK=TESTNET|PUBLIC
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Contract IDs
ARBITRAGE_DETECTOR_CONTRACT_ID=your_contract_id
REFLECTOR_ORACLE_CONTRACT_ID=your_oracle_id
TRADING_ENGINE_CONTRACT_ID=your_trading_id
FLASH_LOAN_ENGINE_CONTRACT_ID=your_flash_loan_id

# Reflector Oracle
REFLECTOR_API_KEY=your_api_key
```

#### Optional Variables
```env
# Server
PORT=8768
DEBUG=false

# Security
SECRET_KEY=your_secret_key
JWT_SECRET=your_jwt_secret

# Trading
MIN_PROFIT_THRESHOLD=0.01
MAX_TRADE_AMOUNT=1000
SLIPPAGE_TOLERANCE=0.005
```

### Production Checklist

- [ ] Update all contract IDs to mainnet addresses
- [ ] Set `STELLAR_NETWORK=PUBLIC`
- [ ] Configure production Horizon/Soroban URLs
- [ ] Set strong `SECRET_KEY` and `JWT_SECRET`
- [ ] Configure monitoring and alerts
- [ ] Set up SSL certificates
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Configure log aggregation

## 🔍 Monitoring

### Health Checks
- Backend: `GET /health`
- Database: Connection status
- WebSocket: Connection status

### Logging
- Application logs: `/tmp/arbitrage.log`
- Access logs: Nginx/Render
- Error tracking: Console/Render logs

### Metrics
- Arbitrage opportunities detected
- Successful trades executed
- API response times
- WebSocket connections

## 🚨 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check CORS configuration
   - Verify WebSocket URL in frontend
   - Check firewall/proxy settings

2. **Contract Interaction Failed**
   - Verify contract IDs are correct
   - Check Stellar network configuration
   - Ensure sufficient XLM balance

3. **Database Connection Error**
   - Verify DATABASE_URL format
   - Check database service status
   - Ensure network connectivity

4. **Build Failures**
   - Check Node.js/Python versions
   - Verify all dependencies installed
   - Check environment variables

### Debug Commands

```bash
# Check backend logs
docker-compose logs backend

# Check database connection
docker-compose exec postgres psql -U arbitrage_user -d arbitrage

# Test WebSocket connection
wscat -c ws://localhost:8768

# Check frontend build
npm run build
```

## 📚 Additional Resources

- [Render.com Documentation](https://render.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Stellar Documentation](https://developers.stellar.org/)
- [Reflector Oracle API](https://reflector.network/docs)

## 🔐 Security Considerations

- Never commit `.env` files to version control
- Use strong, unique secrets in production
- Enable HTTPS in production
- Configure proper CORS origins
- Implement rate limiting
- Regular security updates
- Monitor for suspicious activity

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Verify environment configuration
4. Contact support with specific error messages