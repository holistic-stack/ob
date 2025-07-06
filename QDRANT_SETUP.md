# Qdrant GPU Setup for RTX 3070

This setup provides a simplified Qdrant configuration optimized for NVIDIA RTX 3070 GPU acceleration.

## 📋 Prerequisites

### 1. NVIDIA Drivers
Ensure you have the latest NVIDIA drivers installed:
- Download from: https://www.nvidia.com/drivers/
- Minimum version: 470.x or newer

### 2. Docker Desktop
- Install Docker Desktop for Windows
- Enable WSL 2 backend (recommended)
- Ensure Docker is running

### 3. NVIDIA Container Toolkit
Install the NVIDIA Container Toolkit to enable GPU support in Docker:

```bash
# For Windows with WSL2, run in WSL2 terminal:
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

For detailed installation instructions: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html

## 🚀 Quick Start

### Option 1: Using the Batch Script (Windows)
```cmd
# Simply double-click or run:
start-qdrant.bat
```

### Option 2: Using Docker Compose Directly
```bash
# Start Qdrant with GPU support
docker-compose -f docker-compose.qdrant.yml up -d

# Check logs to verify GPU initialization
docker logs qdrant-gpu | grep -i gpu

# Stop Qdrant
docker-compose -f docker-compose.qdrant.yml down
```

## 📁 File Structure

```
├── qdrant-config.yaml          # Optimized configuration for RTX 3070
├── docker-compose.qdrant.yml   # Docker Compose with GPU support
├── start-qdrant.bat           # Windows startup script
├── start-qdrant.sh            # Linux/macOS startup script
└── QDRANT_SETUP.md            # This documentation
```

## ⚙️ Configuration Highlights

### GPU Settings
- **GPU Indexing**: Enabled for faster vector operations
- **Half Precision**: Enabled for better RTX 3070 performance
- **Device Filter**: Set to "nvidia" to use only NVIDIA GPUs
- **Segment Size**: Optimized for 8GB VRAM (1GB max segments)

### Performance Optimizations
- **Memory Mapping**: Enabled for segments >500MB
- **On-disk Payloads**: Enabled to save RAM
- **Search Threads**: Auto-selected
- **Optimization Threads**: Limited to 2 to avoid GPU interference

## 🌐 Access Points

Once running, Qdrant will be available at:
- **Web UI**: http://localhost:6333/dashboard
- **HTTP API**: http://localhost:6333
- **gRPC API**: localhost:6334
- **API Key**: `qdrant` (change in production!)

## 🔧 Customization

### Change API Key
Edit `qdrant-config.yaml`:
```yaml
service:
  api_key: your_secure_key_here
```

Or set via environment variable in `docker-compose.qdrant.yml`:
```yaml
environment:
  - QDRANT__SERVICE__API_KEY=your_secure_key_here
```

### Adjust GPU Settings
Edit the `gpu` section in `qdrant-config.yaml`:
```yaml
gpu:
  indexing: true
  force_half_precision: true  # Set to false for higher precision
  groups_count: 512          # Adjust based on performance testing
```

### Memory Optimization
For collections with large vectors, adjust segment size:
```yaml
storage:
  optimizers:
    max_segment_size_kb: 500000  # Reduce for smaller segments
```

## 🐛 Troubleshooting

### GPU Not Detected
1. Verify NVIDIA drivers: `nvidia-smi`
2. Check Docker GPU access: `docker run --rm --gpus=all nvidia/cuda:11.0-base nvidia-smi`
3. Restart Docker Desktop after installing nvidia-container-toolkit

### Container Won't Start
1. Check logs: `docker-compose -f docker-compose.qdrant.yml logs`
2. Verify configuration: `docker-compose -f docker-compose.qdrant.yml config`
3. Ensure ports 6333/6334 are not in use

### Performance Issues
1. Monitor GPU usage: `nvidia-smi -l 1`
2. Check Qdrant logs for GPU initialization messages
3. Adjust `groups_count` in GPU configuration
4. Consider reducing `max_segment_size_kb` for better GPU utilization

## 📊 Monitoring

### Check GPU Usage
```bash
# Monitor GPU utilization
nvidia-smi -l 1

# Check Qdrant GPU logs
docker logs qdrant-gpu | grep -i gpu
```

### Verify Configuration
```bash
# Check if GPU is properly initialized
curl -H "api-key: qdrant" http://localhost:6333/
```

## 🔒 Security Notes

- **Change the default API key** before production use
- Consider enabling TLS for production deployments
- Restrict network access using Docker networks or firewall rules
- Regularly update the Qdrant image for security patches

## 📚 Additional Resources

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [GPU Support Guide](https://qdrant.tech/documentation/guides/running-with-gpu/)
- [Configuration Reference](https://qdrant.tech/documentation/guides/configuration/)
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/)
