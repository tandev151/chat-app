#!/bin/bash
# Build script for Docker image with amd64 architecture

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="chat-be"
# IMAGE_NAME="nqoctai1210/quickbuy-be"
VERSION_TAG=$(date +%Y%m%d%H%M)
PLATFORM="linux/arm64"
NO_CACHE="--no-cache"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Building Docker Image${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Image: ${YELLOW}${IMAGE_NAME}${NC}"
echo -e "Platform: ${YELLOW}${PLATFORM}${NC}"
echo -e "Version: ${YELLOW}${VERSION_TAG}${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Build the image
echo -e "${GREEN}Building image...${NC}"
docker buildx build \
    --platform ${PLATFORM} \
    --tag ${IMAGE_NAME}:latest \
    --tag ${IMAGE_NAME}:${VERSION_TAG} \
    --load \
    ${NO_CACHE} \
    .

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Build Successful!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "Image tags:"
    echo -e "  - ${YELLOW}${IMAGE_NAME}:latest${NC}"
    echo -e "  - ${YELLOW}${IMAGE_NAME}:${VERSION_TAG}${NC}"
    echo ""
    echo -e "To run the container:"
    echo -e "  ${YELLOW}docker run -p 8000:8000 ${IMAGE_NAME}:latest${NC}"
    echo ""
    echo -e "Or use docker-compose:"
    echo -e "  ${YELLOW}docker-compose up${NC}"
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}Build Failed!${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
