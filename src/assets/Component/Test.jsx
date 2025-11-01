import { useRef, useState, useEffect, useCallback } from "react";
import quockhanhImg from "../img/quockhanh.jpg";
export default function AvatarMaker() {
  const canvasRef = useRef(null);
  const [exportFormat, setExportFormat] = useState("png");
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(800);

  const [removeBgLoading, setRemoveBgLoading] = useState(false);
  const [layers, setLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, layer: null });
  const [rotationStart, setRotationStart] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [customFrameImage, setCustomFrameImage] = useState(null);
  const [hoveredHandle, setHoveredHandle] = useState(null);
  const [frameOptions, setFrameOptions] = useState({});

  // Redraw canvas
  useEffect(() => {
    redrawCanvas();
  }, [
    layers,
    canvasWidth,
    canvasHeight,
    selectedFrame,
    customFrameImage,
    frameOptions,
    selectedLayer,
  ]);

  // useEffect(() => {}, []);

  const rotatePoint = (px, py, cx, cy, angle) => {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = px - cx;
    const dy = py - cy;
    const nx = cx + dx * cos - dy * sin;
    const ny = cy + dx * sin + dy * cos;
    return { x: nx, y: ny };
  };

  const unrotatePoint = (mx, my, cx, cy, angle) => {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = mx - cx;
    const dy = my - cy;
    const ux = cx + dx * cos + dy * sin;
    const uy = cy - dx * sin + dy * cos;
    return { x: ux, y: uy };
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    layers.forEach((layer, index) => {
      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;

      const centerX = layer.x + (layer.width || layer.size || 0) / 2;
      const centerY = layer.y + (layer.height || layer.size || 0) / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(((layer.rotation || 0) * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      if (layer.type === "image") {
        ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
      } else if (layer.type === "text") {
        ctx.font = `${layer.fontWeight || "normal"} ${layer.fontSize || 32}px ${
          layer.fontFamily || "Arial"
        }`;
        ctx.fillStyle = layer.color;
        ctx.textAlign = layer.textAlign || "center";
        ctx.textBaseline = "top";
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Vẽ text với word wrap
        const words = layer.text.split(" ");
        const lineHeight = layer.fontSize * 1.2;
        let line = "";
        let y = layer.y;
        const maxWidth = layer.width || 200;

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth > maxWidth && i > 0) {
            // Vẽ dòng hiện tại
            const xPos =
              layer.textAlign === "center"
                ? layer.x + maxWidth / 2
                : layer.textAlign === "right"
                ? layer.x + maxWidth
                : layer.x;
            ctx.fillText(line, xPos, y);
            line = words[i] + " ";
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        // Vẽ dòng cuối cùng
        const xPos =
          layer.textAlign === "center"
            ? layer.x + maxWidth / 2
            : layer.textAlign === "right"
            ? layer.x + maxWidth
            : layer.x;
        ctx.fillText(line, xPos, y);
      } else if (layer.type === "shape") {
        ctx.fillStyle = layer.color;
        const cx = layer.x + layer.size / 2;
        const cy = layer.y + layer.size / 2;
        if (layer.shape === "circle") {
          ctx.beginPath();
          ctx.arc(cx, cy, layer.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (layer.shape === "rect") {
          ctx.fillRect(
            layer.x,
            layer.y,
            layer.width ?? layer.size,
            layer.height ?? layer.size
          );
        } else if (layer.shape === "star") {
          drawStar(ctx, cx, cy, 5, layer.size / 2, layer.size / 4);
          ctx.fill();
        } else if (layer.shape === "triangle") {
          ctx.beginPath();
          ctx.moveTo(layer.x + layer.size / 2, layer.y);
          ctx.lineTo(layer.x, layer.y + layer.size);
          ctx.lineTo(layer.x + layer.size, layer.y + layer.size);
          ctx.closePath();
          ctx.fill();
        } else if (layer.shape === "arrow") {
          ctx.beginPath();
          ctx.moveTo(layer.x, layer.y + layer.size / 2);
          ctx.lineTo(layer.x + layer.size * 0.7, layer.y + layer.size / 2);
          ctx.lineTo(layer.x + layer.size * 0.7, layer.y);
          ctx.lineTo(layer.x + layer.size, layer.y + layer.size / 2);
          ctx.lineTo(layer.x + layer.size * 0.7, layer.y + layer.size);
          ctx.lineTo(layer.x + layer.size * 0.7, layer.y + layer.size / 2);
          ctx.lineTo(layer.x, layer.y + layer.size / 2);
          ctx.closePath();
          ctx.fill();
        } else if (layer.shape === "heart") {
          ctx.beginPath();
          ctx.moveTo(layer.x + layer.size / 2, layer.y + layer.size / 4);
          ctx.bezierCurveTo(
            layer.x + layer.size * 0.75,
            layer.y,
            layer.x + layer.size,
            layer.y + layer.size / 3,
            layer.x + layer.size / 2,
            layer.y + layer.size * 0.75
          );
          ctx.bezierCurveTo(
            layer.x,
            layer.y + layer.size / 3,
            layer.x + layer.size * 0.25,
            layer.y,
            layer.x + layer.size / 2,
            layer.y + layer.size / 4
          );
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore();

      if (index === selectedLayer && !layer.locked) {
        const bounds = getLayerBounds(layer, ctx);
        const rotation = layer.rotation || 0;
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;

        //Tính toán góc xoay
        const tl = rotatePoint(bounds.x, bounds.y, cx, cy, rotation);
        const tr = rotatePoint(
          bounds.x + bounds.width,
          bounds.y,
          cx,
          cy,
          rotation
        );
        const bl = rotatePoint(
          bounds.x,
          bounds.y + bounds.height,
          cx,
          cy,
          rotation
        );
        const br = rotatePoint(
          bounds.x + bounds.width,
          bounds.y + bounds.height,
          cx,
          cy,
          rotation
        );

        // Draw dashed bounds
        ctx.beginPath();
        ctx.moveTo(tl.x, tl.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.lineTo(br.x, br.y);
        ctx.lineTo(bl.x, bl.y);
        ctx.closePath();
        ctx.strokeStyle = "#000000ff";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        const handleSize = 15;

        // Rotated handle centers (corners)
        const rotatedHandles = [
          { pos: tl, type: "top-left" },
          { pos: tr, type: "top-right" },
          { pos: bl, type: "bottom-left" },
          { pos: br, type: "bottom-right" },
        ];

        // Rotate handle
        const unrotRotateCenter = {
          x: bounds.x + bounds.width / 2,
          y: bounds.y - 20,
        };
        const rotatedRotateCenter = rotatePoint(
          unrotRotateCenter.x,
          unrotRotateCenter.y,
          cx,
          cy,
          rotation
        );

        // Line to rotate handle
        const unrotTopCenter = { x: bounds.x + bounds.width / 2, y: bounds.y };
        const rotatedTopCenter = rotatePoint(
          unrotTopCenter.x,
          unrotTopCenter.y,
          cx,
          cy,
          rotation
        );
        ctx.beginPath();
        ctx.moveTo(rotatedTopCenter.x, rotatedTopCenter.y);
        ctx.lineTo(rotatedRotateCenter.x, rotatedRotateCenter.y);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw resize handles
        ctx.fillStyle = "#3b82f6";
        rotatedHandles.forEach((h) => {
          ctx.fillRect(
            h.pos.x - handleSize / 2,
            h.pos.y - handleSize / 2,
            handleSize,
            handleSize
          );
          if (hoveredHandle === h.type) {
            ctx.strokeStyle = "#000207ff";
            ctx.lineWidth = 2;
            ctx.strokeRect(
              h.pos.x - handleSize / 2,
              h.pos.y - handleSize / 2,
              handleSize,
              handleSize
            );
          }
        });

        // Draw rotate handle
        ctx.beginPath();
        ctx.arc(
          rotatedRotateCenter.x,
          rotatedRotateCenter.y,
          handleSize / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        if (hoveredHandle === "rotate") {
          ctx.strokeStyle = "#000207ff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    });

    // Vẽ frame sau để ở lớp cao nhất
    if (selectedFrame?.draw) {
      ctx.save();
      const options = frameOptions[selectedFrame.id] || {};
      if (options.style === "dashed") {
        ctx.setLineDash([10, 5]);
      } else if (options.style === "dotted") {
        ctx.setLineDash([2, 4]);
      } else {
        ctx.setLineDash([]);
      }
      selectedFrame.draw(ctx, canvas.width, options);
      ctx.restore();
    }
    if (customFrameImage) {
      ctx.save();
      ctx.drawImage(customFrameImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, [
    layers,
    selectedLayer,
    selectedFrame,
    customFrameImage,
    frameOptions,
    hoveredHandle,
  ]);
  const getLayerBounds = (layer, ctx) => {
    if (layer.type === "image") {
      return {
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
      };
    } else if (layer.type === "text") {
      ctx.font = `${layer.fontWeight || "normal"} ${layer.fontSize || 32}px ${
        layer.fontFamily || "Arial"
      }`;
      return {
        x: layer.x,
        y: layer.y,
        width: layer.width || 200,
        height: layer.height || 60,
      };
    } else if (layer.type === "shape") {
      return {
        x: layer.x,
        y: layer.y,
        width: layer.size,
        height: layer.size,
      };
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  };
  const getResizeHandle = (mx, my, bounds, layer) => {
    const handleSize = 15; // Tăng lên 15 để khớp với draw
    const rotation = layer.rotation || 0;
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const { x: ux, y: uy } = unrotatePoint(mx, my, cx, cy, rotation);

    const handles = [
      {
        x: bounds.x,
        y: bounds.y,
        type: "top-left",
      },
      {
        x: bounds.x + bounds.width,
        y: bounds.y,
        type: "top-right",
      },
      {
        x: bounds.x,
        y: bounds.y + bounds.height,
        type: "bottom-left",
      },
      {
        x: bounds.x + bounds.width,
        y: bounds.y + bounds.height,
        type: "bottom-right",
      },
      {
        x: bounds.x + bounds.width / 2,
        y: bounds.y - 20,
        type: "rotate",
      },
    ];

    for (const h of handles) {
      if (
        ux >= h.x - handleSize / 2 &&
        ux <= h.x + handleSize / 2 &&
        uy >= h.y - handleSize / 2 &&
        uy <= h.y + handleSize / 2
      )
        return h.type;
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const ctx = canvasRef.current.getContext("2d");

    // Kiểm tra xem có đang click vào handle không
    if (selectedLayer !== null && !layers[selectedLayer].locked) {
      const layer = layers[selectedLayer];
      const bounds = getLayerBounds(layer, ctx);
      const handle = getResizeHandle(mx, my, bounds, layer);
      if (handle) {
        if (handle === "rotate") {
          setIsRotating(true);
          const cx = bounds.x + bounds.width / 2;
          const cy = bounds.y + bounds.height / 2;
          const startAngle = Math.atan2(my - cy, mx - cx);
          setRotationStart(startAngle);
          setDragStart({ x: mx, y: my, layer: { ...layer } });
          return;
        } else {
          setIsResizing(true);
          setResizeHandle(handle);
          setDragStart({ x: mx, y: my, layer: { ...layer } });
          return;
        }
      }
    }

    // Kiểm tra từng layer từ trên xuống
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.isFrame) continue;

      const bounds = getLayerBounds(layer, ctx);
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const rotation = layer.rotation || 0;
      const { x: ux, y: uy } = unrotatePoint(mx, my, cx, cy, rotation);

      // Kiểm tra bounds trước
      if (
        ux >= bounds.x &&
        ux <= bounds.x + bounds.width &&
        uy >= bounds.y &&
        uy <= bounds.y + bounds.height
      ) {
        // Nếu là ảnh, kiểm tra pixel tại điểm click
        if (layer.type === "image") {
          try {
            // Vẽ layer vào canvas tạm để kiểm tra pixel
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            const tempCtx = tempCanvas.getContext("2d");

            tempCtx.save();
            const centerX = layer.x + layer.width / 2;
            const centerY = layer.y + layer.height / 2;
            tempCtx.translate(centerX, centerY);
            tempCtx.rotate(((layer.rotation || 0) * Math.PI) / 180);
            tempCtx.translate(-centerX, -centerY);
            tempCtx.drawImage(
              layer.image,
              layer.x,
              layer.y,
              layer.width,
              layer.height
            );
            tempCtx.restore();

            const imgData = tempCtx.getImageData(
              Math.floor(mx),
              Math.floor(my),
              1,
              1
            ).data;

            // Chỉ xử lý click nếu pixel không trong suốt (alpha > 10)
            if (imgData[3] > 10) {
              setSelectedLayer(i);
              setIsDragging(true);
              setDragStart({ x: mx - layer.x, y: my - layer.y });
              return;
            }
          } catch (err) {
            console.error("Error checking pixel:", err);
            // Fallback: chấp nhận click
            setSelectedLayer(i);
            setIsDragging(true);
            setDragStart({ x: mx - layer.x, y: my - layer.y });
            return;
          }
        } else {
          // Với các layer khác, chấp nhận click ngay
          setSelectedLayer(i);
          setIsDragging(true);
          setDragStart({ x: mx - layer.x, y: my - layer.y });
          return;
        }
      }
    }
    setSelectedLayer(null);
  };
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const ctx = canvasRef.current.getContext("2d");

    if (selectedLayer !== null && !isDragging && !isResizing && !isRotating) {
      const layer = layers[selectedLayer];
      const bounds = getLayerBounds(layer, ctx);
      const handle = getResizeHandle(mx, my, bounds, layer);
      setHoveredHandle(handle);
      if (handle === "rotate") {
        canvasRef.current.style.cursor = "grab";
      } else if (handle) {
        canvasRef.current.style.cursor =
          handle.includes("top-left") || handle.includes("bottom-right")
            ? "nwse-resize"
            : "nesw-resize";
      } else {
        canvasRef.current.style.cursor = "move";
      }
    } else {
      canvasRef.current.style.cursor = isResizing
        ? "nwse-resize"
        : isRotating
        ? "grabbing"
        : "move";
    }

    if (isRotating && selectedLayer !== null) {
      const layer = dragStart.layer;
      const bounds = getLayerBounds(layer, ctx);
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const currentAngle = Math.atan2(my - cy, mx - cx);
      const delta = currentAngle - rotationStart;
      const newRotation = (layer.rotation || 0) + delta * (180 / Math.PI);
      setLayers((prev) =>
        prev.map((l, i) =>
          i === selectedLayer ? { ...l, rotation: newRotation } : l
        )
      );
    } else if (isResizing && selectedLayer !== null) {
      const initialLayer = dragStart.layer;
      const bounds = getLayerBounds(initialLayer, ctx);
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const rotation = initialLayer.rotation || 0;
      const { x: sux, y: suy } = unrotatePoint(
        dragStart.x,
        dragStart.y,
        cx,
        cy,
        rotation
      );
      const { x: ux, y: uy } = unrotatePoint(mx, my, cx, cy, rotation);
      const deltaX = ux - sux;
      const deltaY = uy - suy;

      let newX = initialLayer.x,
        newY = initialLayer.y,
        newWidth = initialLayer.width || initialLayer.size,
        newHeight = initialLayer.height || initialLayer.size;

      if (initialLayer.type === "image" && initialLayer.originalWidth) {
        const aspect = initialLayer.originalWidth / initialLayer.originalHeight;
        let width = initialLayer.width;
        if (resizeHandle === "top-left") {
          width = initialLayer.width - deltaX;
          newX = initialLayer.x + deltaX;
        } else if (resizeHandle === "top-right") {
          width = initialLayer.width + deltaX;
        } else if (resizeHandle === "bottom-left") {
          width = initialLayer.width - deltaX;
          newX = initialLayer.x + deltaX;
        } else if (resizeHandle === "bottom-right") {
          width = initialLayer.width + deltaX;
        }

        width = Math.max(30, width);
        newHeight = width / aspect;
        if (resizeHandle.includes("top"))
          newY = initialLayer.y + initialLayer.height - newHeight;

        newWidth = width;
      } else if (initialLayer.type === "text") {
        // Resize text box - thay đổi width và height độc lập
        if (resizeHandle === "top-left") {
          newWidth = Math.max(50, initialLayer.width - deltaX);
          newHeight = Math.max(20, initialLayer.height - deltaY);
          newX = initialLayer.x + (initialLayer.width - newWidth);
          newY = initialLayer.y + (initialLayer.height - newHeight);
        } else if (resizeHandle === "top-right") {
          newWidth = Math.max(50, initialLayer.width + deltaX);
          newHeight = Math.max(20, initialLayer.height - deltaY);
          newY = initialLayer.y + (initialLayer.height - newHeight);
        } else if (resizeHandle === "bottom-left") {
          newWidth = Math.max(50, initialLayer.width - deltaX);
          newHeight = Math.max(20, initialLayer.height + deltaY);
          newX = initialLayer.x + (initialLayer.width - newWidth);
        } else if (resizeHandle === "bottom-right") {
          newWidth = Math.max(50, initialLayer.width + deltaX);
          newHeight = Math.max(20, initialLayer.height + deltaY);
        }

        setLayers((prev) =>
          prev.map((l, i) =>
            i === selectedLayer
              ? {
                  ...l,
                  x: newX,
                  y: newY,
                  width: newWidth,
                  height: newHeight,
                }
              : l
          )
        );
        return;
      } else if (initialLayer.type === "shape") {
        const newSize = Math.max(
          30,
          initialLayer.size +
            (resizeHandle.includes("right") || resizeHandle.includes("bottom")
              ? deltaX
              : -deltaX)
        );
        newWidth = newSize;
        newHeight = newSize;
        if (resizeHandle.includes("left"))
          newX = initialLayer.x + initialLayer.size - newSize;
        if (resizeHandle.includes("top"))
          newY = initialLayer.y + initialLayer.size - newSize;
      }

      setLayers((prev) =>
        prev.map((l, i) =>
          i === selectedLayer
            ? {
                ...l,
                x: newX,
                y: newY,
                width: initialLayer.type === "image" ? newWidth : l.width,
                height: initialLayer.type === "image" ? newHeight : l.height,
                size: initialLayer.type === "shape" ? newWidth : l.size,
              }
            : l
        )
      );
    } else if (isDragging && selectedLayer !== null) {
      setLayers((prev) =>
        prev.map((l, i) =>
          i === selectedLayer
            ? { ...l, x: mx - dragStart.x, y: my - dragStart.y }
            : l
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setResizeHandle(null);
    setHoveredHandle(null);
    setDragStart({ x: 0, y: 0, layer: null });
    setRotationStart(0);
  };

  // === CÁC HÀM KHÁC ===
  const handleFrameUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/"))
      return alert("Chỉ chọn file ảnh");

    setRemoveBgLoading(true);

    try {
      // B1: Xóa nền bằng API hoặc local
      const url =
        !!REMOVE_BG_API_KEY && REMOVE_BG_API_KEY !== "YOUR_API_KEY"
          ? await removeBgViaApi(file)
          : await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = async (ev) => {
                const img = new Image();
                img.onload = async () => resolve(await simpleRemoveBg(img));
                img.src = ev.target.result;
              };
              reader.readAsDataURL(file);
            });

      // B2: Load ảnh đã xóa nền
      const img = new Image();
      img.onload = () => {
        // Giới hạn kích thước tối đa (nếu cần)
        const maxSize = 1000;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);

        // Kích thước mới cho canvas
        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        // Lưu kích thước cũ để scale lại layer
        const oldWidth = canvasWidth;
        const oldHeight = canvasHeight;

        // Cập nhật canvas
        setCanvasWidth(newWidth);
        setCanvasHeight(newHeight);

        // Cập nhật ảnh khung
        setCustomFrameImage(img);

        // Scale lại các layer cũ theo tỉ lệ canvas mới
        setLayers((prev) =>
          prev.map((layer) => ({
            ...layer,
            x: (layer.x * newWidth) / oldWidth,
            y: (layer.y * newHeight) / oldHeight,
            width: (layer.width * newWidth) / oldWidth,
            height: (layer.height * newHeight) / oldHeight,
          }))
        );

        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        setRemoveBgLoading(false);
      };

      img.onerror = () => {
        console.error("Ảnh không thể load");
        setRemoveBgLoading(false);
      };

      img.src = url;
    } catch (err) {
      console.error("Lỗi khi xóa nền:", err);
      setRemoveBgLoading(false);
    }
  };

  const clearFrame = () => {
    setSelectedFrame(null);
    setCustomFrameImage(null);
    setFrameOptions({});
  };

  const toggleLockSelected = () => {
    if (selectedLayer === null) return;
    setLayers((prev) =>
      prev.map((l, i) =>
        i === selectedLayer ? { ...l, locked: !l.locked } : l
      )
    );
  };

  const duplicateSelected = () => {
    if (selectedLayer === null) return;
    setLayers((prev) => {
      const copy = {
        ...prev[selectedLayer],
        x: prev[selectedLayer].x + 20,
        y: prev[selectedLayer].y + 20,
      };
      return [...prev, copy];
    });
  };
  const centerSelected = () => {
    if (selectedLayer === null) return;
    setLayers((prev) =>
      prev.map((l, i) => {
        if (i !== selectedLayer) return l;
        if (l.type === "image")
          return {
            ...l,
            x: (canvasWidth - l.width) / 2,
            y: (canvasHeight - l.height) / 2,
          };
        if (l.type === "text")
          return {
            ...l,
            x: (canvasWidth - l.width) / 2,
            y: (canvasHeight - l.height) / 2,
          };
        if (l.type === "shape")
          return {
            ...l,
            x: (canvasWidth - l.size) / 2,
            y: (canvasHeight - l.size) / 2,
          };
        return l;
      })
    );
  };
  const changeOpacitySelected = (v) => {
    if (selectedLayer === null) return;
    setLayers((prev) =>
      prev.map((l, i) => (i === selectedLayer ? { ...l, opacity: v } : l))
    );
  };

  const changeTextProp = (prop, value) => {
    if (selectedLayer === null || layers[selectedLayer].type !== "text") return;
    setLayers((prev) =>
      prev.map((l, i) => (i === selectedLayer ? { ...l, [prop]: value } : l))
    );
  };

  const changeShapeColor = (color) => {
    if (selectedLayer === null || layers[selectedLayer].type !== "shape")
      return;
    setLayers((prev) =>
      prev.map((l, i) => (i === selectedLayer ? { ...l, color } : l))
    );
  };

  const drawStar = (ctx, cx, cy, spikes, outer, inner) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx,
      y = cy;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outer);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outer;
      y = cy + Math.sin(rot) * outer;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * inner;
      y = cy + Math.sin(rot) * inner;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outer);
    ctx.closePath();
  };

  const simpleRemoveBg = (img) =>
    new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        const bright = (r + g + b) / 3;
        if ((r > 200 && g > 200 && b > 200) || (g > r && g > b && bright > 100))
          data[i + 3] = 0;
      }
      ctx.putImageData(
        ctx.getImageData(0, 0, canvas.width, canvas.height),
        0,
        0
      );
      resolve(canvas.toDataURL());
    });

  const REMOVE_BG_API_KEY = "t1sfFgyoYcyGcno2gVoKT8zB";

  const removeBgViaApi = async (file) => {
    const form = new FormData();
    form.append("image_file", file);
    form.append("size", "auto");
    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": REMOVE_BG_API_KEY },
      body: form,
    });
    if (!res.ok) throw new Error("Remove.bg failed");
    return URL.createObjectURL(await res.blob());
  };

  const addBackground = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.max(
          canvasWidth / img.width,
          canvasHeight / img.height
        );
        setLayers((prev) => [
          {
            type: "image",
            image: img,
            x: 0,
            y: 0,
            width: img.width * scale,
            height: img.height * scale,
            name: `bg-${Date.now()}`,
            originalWidth: img.width,
            originalHeight: img.height,
            rotation: 0,
          },
          ...prev,
        ]);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const addPortrait = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRemoveBgLoading(true);
    try {
      const url =
        !!REMOVE_BG_API_KEY && REMOVE_BG_API_KEY !== "YOUR_API_KEY"
          ? await removeBgViaApi(file)
          : await new Promise((r) => {
              const reader = new FileReader();
              reader.onload = async (ev) => {
                const img = new Image();
                img.onload = async () => r(await simpleRemoveBg(img));
                img.src = ev.target.result;
              };
              reader.readAsDataURL(file);
            });

      const img = new Image();
      img.onload = () => {
        const max = canvasWidth * 0.7;
        const scale = Math.min(max / img.width, max / img.height);
        setLayers((prev) => [
          ...prev,
          {
            type: "image",
            image: img,
            x: (canvasWidth - img.width * scale) / 2,
            y: (canvasHeight - img.height * scale) / 2,
            width: img.width * scale,
            height: img.height * scale,
            name: "portrait",
            originalWidth: img.width,
            originalHeight: img.height,
            rotation: 0,
          },
        ]);
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        setRemoveBgLoading(false);
      };
      img.src = url;
    } catch (err) {
      console.error(err);
      setRemoveBgLoading(false);
    }
  };

  const addStickerFromFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const max = canvasWidth * 0.3;
        const scale = Math.min(max / img.width, max / img.height);
        setLayers((prev) => [
          ...prev,
          {
            type: "image",
            image: img,
            x: (canvasWidth - img.width * scale) / 2,
            y: (canvasHeight - img.height * scale) / 2,
            width: img.width * scale,
            height: img.height * scale,
            name: `sticker-${Date.now()}`,
            originalWidth: img.width,
            originalHeight: img.height,
            rotation: 0,
          },
        ]);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const exportAvatar = () => {
    const url = canvasRef.current.toDataURL(`image/${exportFormat}`, 1.0);
    const a = document.createElement("a");
    a.href = url;
    a.download = `avatar-${Date.now()}.${exportFormat}`;
    a.click();
  };

  const deleteSelected = () => {
    if (selectedLayer !== null) {
      setLayers((prev) => prev.filter((_, i) => i !== selectedLayer));
      setSelectedLayer(null);
    }
  };

  const clearAll = () => {
    setLayers([]);
    setSelectedLayer(null);
  };

  const addCustomText = () => {
    const text = prompt("Nhập text:", "Your Name");
    if (!text) return;
    setLayers((prev) => [
      ...prev,
      {
        type: "text",
        text,
        x: canvasWidth / 2 - 100, // Đổi vị trí x để căn theo box
        y: canvasHeight - 80,
        width: 200, // Thêm width mặc định
        height: 60, // Thêm height mặc định
        fontSize: 32,
        fontFamily: "Arial",
        fontWeight: "normal",
        color: "#000000",
        textAlign: "center",
        name: `text-${Date.now()}`,
        rotation: 0,
      },
    ]);
  };
  const addShape = (shape) => {
    const colors = {
      circle: "#ff6b6b",
      rect: "#4dabf7",
      star: "#ffd43b",
      triangle: "#4caf50",
      arrow: "#2196f3",
      heart: "#e91e63",
    };
    setLayers((prev) => [
      ...prev,
      {
        type: "shape",
        shape,
        x: 100,
        y: 100,
        size: 100,
        color: colors[shape],
        name: `shape-${shape}-${Date.now()}`,
        rotation: 0,
      },
    ]);
  };

  const moveLayer = (dir) => {
    if (selectedLayer === null) return;
    setLayers((prev) => {
      const arr = [...prev];
      const i = selectedLayer;
      if (dir === "up" && i < arr.length - 1) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        setSelectedLayer(i + 1);
      } else if (dir === "down" && i > 0) {
        [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
        setSelectedLayer(i - 1);
      }
      return arr;
    });
  };

  const getLayerThumbnail = (layer) => {
    const c = document.createElement("canvas");
    c.width = c.height = 50;
    const ctx = c.getContext("2d");
    if (layer.type === "image") ctx.drawImage(layer.image, 0, 0, 50, 50);
    else if (layer.type === "text") {
      ctx.font = "10px Arial";
      ctx.fillText(layer.text.slice(0, 8), 5, 25);
    } else if (layer.type === "shape") {
      ctx.fillStyle = layer.color;
      if (layer.shape === "circle") {
        ctx.arc(25, 25, 20, 0, Math.PI * 2);
        ctx.fill();
      } else if (layer.shape === "rect") {
        ctx.fillRect(5, 5, 40, 40);
      } else if (layer.shape === "star") {
        drawStar(ctx, 25, 25, 5, 20, 10);
        ctx.fill();
      } else if (layer.shape === "triangle") {
        ctx.beginPath();
        ctx.moveTo(25, 5);
        ctx.lineTo(5, 45);
        ctx.lineTo(45, 45);
        ctx.closePath();
        ctx.fill();
      } else if (layer.shape === "arrow") {
        ctx.beginPath();
        ctx.moveTo(5, 25);
        ctx.lineTo(35, 25);
        ctx.lineTo(35, 5);
        ctx.lineTo(45, 25);
        ctx.lineTo(35, 45);
        ctx.lineTo(35, 25);
        ctx.lineTo(5, 25);
        ctx.closePath();
        ctx.fill();
      } else if (layer.shape === "heart") {
        ctx.beginPath();
        ctx.moveTo(25, 15);
        ctx.bezierCurveTo(35, 5, 45, 15, 25, 35);
        ctx.bezierCurveTo(5, 15, 15, 5, 25, 15);
        ctx.closePath();
        ctx.fill();
      }
    }
    return c.toDataURL();
  };
  const FrameQuocKhanh = async () => {
    setRemoveBgLoading(true);

    try {
      // 🖼️ B1: Lấy ảnh từ đường dẫn cố định
      const response = await fetch(quockhanhImg);
      if (!response.ok) throw new Error("Không thể tải quockhanh.jpg");
      const blob = await response.blob();
      const file = new File([blob], "quockhanh.jpg", { type: blob.type });

      // 🧠 B2: Xóa nền bằng API hoặc local fallback
      const url =
        !!REMOVE_BG_API_KEY && REMOVE_BG_API_KEY !== "YOUR_API_KEY"
          ? await removeBgViaApi(file)
          : await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = async (ev) => {
                const img = new Image();
                img.onload = async () => resolve(await simpleRemoveBg(img));
                img.src = ev.target.result;
              };
              reader.readAsDataURL(file);
            });

      // 🧩 B3: Load ảnh khung đã xóa nền
      const img = new Image();
      img.onload = () => {
        // Giới hạn kích thước tối đa nếu cần
        const maxSize = 1000;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);

        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        const oldWidth = canvasWidth;
        const oldHeight = canvasHeight;

        // Cập nhật canvas
        setCanvasWidth(newWidth);
        setCanvasHeight(newHeight);

        // Cập nhật ảnh khung
        setCustomFrameImage(img);

        // Scale lại các layer cũ theo tỉ lệ mới
        setLayers((prev) =>
          prev.map((layer) => ({
            ...layer,
            x: (layer.x * newWidth) / oldWidth,
            y: (layer.y * newHeight) / oldHeight,
            width: layer.width
              ? (layer.width * newWidth) / oldWidth
              : layer.width,
            height: layer.height
              ? (layer.height * newHeight) / oldHeight
              : layer.height,
          }))
        );

        // 🟥 B4: Thêm layer phủ màu đỏ toàn bộ canvas
        setLayers((prev) => [
          ...prev,
          {
            type: "shape",
            shape: "rect",
            color: "#ff0000",
            x: 0,
            y: 0,
            width: newWidth,
            height: newHeight,
            name: "red-overlay",
            opacity: 0.4, // tùy chọn: độ trong suốt
            rotation: 0,
          },
        ]);

        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        setRemoveBgLoading(false);
      };

      img.onerror = () => {
        console.error("Ảnh không thể load");
        setRemoveBgLoading(false);
      };

      img.src = url;
    } catch (err) {
      console.error("Lỗi khi xóa nền hoặc tải ảnh:", err);
      setRemoveBgLoading(false);
    }
  };
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const simulatedEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => e.preventDefault(),
    };
    handleMouseDown(simulatedEvent);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    const simulatedEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => e.preventDefault(),
    };
    handleMouseMove(simulatedEvent);
  };

  const handleTouchEnd = (e) => {
    const simulatedEvent = { preventDefault: () => e.preventDefault() };
    handleMouseUp(simulatedEvent);
  };
  return (
    //prettier-ignore
    <div className="min-vh-100 p-4">
      <div className="container">
        <h1 className="display-5 fw-bold text-center mb-2 text-dark">Avatar Maker</h1>
        <p className="text-center text-muted mb-4">Tạo ảnh đại diện chuyên nghiệp với công cụ xóa phông tự động</p>
        <div className="row g-4">
          <div className="col-12 col-lg-4 d-flex flex-column gap-4">
            {/* Upload */}
            <div className="card shadow p-4">
              <h3 className="h5 fw-bold mb-3 text-dark">Upload Ảnh</h3>
              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label mb-2">Ảnh Nền</label>
                  <input type="file" accept="image/*" onChange={addBackground} className="form-control"/>
                  <p className="small text-info mt-1">Có thể thêm nhiều ảnh nền</p>
                </div>
                <div>
                  <label className="form-label mb-2">Ảnh xóa Phông {" "}{removeBgLoading && (<span className="small text-primary">(Đang xử lý...)</span>)}</label>
                  <input type="file" accept="image/*" onChange={addPortrait} disabled={removeBgLoading} className="form-control"/>
                  <p className="small text-muted mt-1">Tự động xóa phông nền sáng</p>
                </div>
              </div>
            </div>
            {/* Cài đặt */}
            <div className="card shadow p-4">
              <h3 className="h5 fw-bold mb-3 text-dark">Tùy Chỉnh</h3>
              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label mb-2">Kích thước: {canvasWidth}px</label>
                  <input type="range" min="400" max="1200" step="100" value={canvasWidth} onChange={(e) => setCanvasWidth(+e.target.value)} className="form-range" />
                </div>
                <div>
                  <label className="form-label mb-2">Định dạng</label>
                  <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="form-select" >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
                <div>
                  <label className="form-label mb-2">Khung</label>
                  <div>
                    <button class = "btn btn-sm btn-outline-success mb-2" onClick={FrameQuocKhanh}>Kỉ niệm ngày quốc khánh</button>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button className="btn btn-sm btn-outline-danger" onClick={clearFrame} > Xóa </button>
                  </div>
                </div>
                <div>
                  <label className="form-label mb-2">Import khung PNG</label>
                  <input type="file" accept="image/*" onChange={handleFrameUpload} className="form-control" />
                </div>
              </div>
            </div>

            {/* Công cụ */}
            <div className="card shadow p-4">
              <h3 className="h5 fw-bold mb-3 text-dark">Công Cụ</h3>
              <div className="row g-2">
                <div className="col-6 d-grid"> <button onClick={addCustomText} className="btn btn-primary btn-sm" > Text </button> </div>
                <div className="col-6 d-grid">
                  <button onClick={() => addShape("circle")} className="btn btn-danger btn-sm" > Tròn </button>
                </div>
                <div className="col-6 d-grid">
                  <button onClick={() => addShape("rect")} className="btn btn-primary btn-sm" > Vuông </button>
                </div>
                <div className="col-6 d-grid">
                  <button onClick={() => addShape("star")} className="btn btn-warning btn-sm text-white" > Sao </button>
                </div>
                <div className="col-6 d-grid">
                  <button onClick={() => addShape("triangle")} className="btn btn-success btn-sm" > Tam giác </button>
                </div>
                <div className="col-6 d-grid">
                  <button onClick={() => addShape("arrow")} className="btn btn-info btn-sm" > Mũi tên </button>
                </div>
                <div className="col-6 d-grid">
                  <button onClick={() => addShape("heart")} className="btn btn-danger btn-sm" > Tim </button>
                </div>
                <div className="col-6 d-grid">
                  <button onClick={() => moveLayer("up")} disabled={selectedLayer === null} className="btn btn-secondary btn-sm" > Lên </button>
                </div>
                <div className="col-6 d-grid">
                  <button onClick={() => moveLayer("down")} disabled={selectedLayer === null} className="btn btn-secondary btn-sm" > Xuống </button>
                </div>
                <div className="col-12 d-grid">
                  <button onClick={deleteSelected} className="btn btn-danger btn-sm" > Xóa </button>
                </div>
                <div className="col-6 d-grid">
                  <button onClick={toggleLockSelected} disabled={selectedLayer === null} className="btn btn-outline-secondary btn-sm" > Khóa </button>
                </div>
                <div className="col-6 d-grid">
                  <button onClick={duplicateSelected} disabled={selectedLayer === null} className="btn btn-outline-primary btn-sm" > Nhân đôi </button>
                </div>
                <div className="col-6 d-grid">
                  <button onClick={centerSelected} disabled={selectedLayer === null} className="btn btn-outline-success btn-sm" > Căn giữa </button>
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">Độ mờ</label>
                  <input type="range" min="0" max="1" step="0.05" onChange={(e) => changeOpacitySelected(+e.target.value)} disabled={selectedLayer === null} className="form-range" />
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label mb-2">Import Sticker</label>
                <input type="file" accept="image/*" onChange={addStickerFromFile} className="form-control" />
              </div>

              {selectedLayer !== null &&
                layers[selectedLayer].type === "text" && (
                  <div className="mt-3">
                    <h4 className="h6 fw-bold mb-2">Text</h4>
                    <select onChange={(e) => changeTextProp("fontFamily", e.target.value) } className="form-select form-select-sm mb-1" >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times</option>
                      <option value="Courier New">Courier</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Georgia">Georgia</option>
                    </select>
                    <select onChange={(e) => changeTextProp("fontWeight", e.target.value) } className="form-select form-select-sm mb-1" >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="italic">Italic</option>
                      <option value="bold italic">Bold Italic</option>
                    </select>
                    <input type="number" min="10" max="200" value={layers[selectedLayer].fontSize} onChange={(e) => changeTextProp("fontSize", +e.target.value) } className="form-control form-control-sm mb-1" />
                    <input type="color" value={layers[selectedLayer].color} onChange={(e) => changeTextProp("color", e.target.value)} className="form-control form-control-color mb-1" />
                    <select onChange={(e) => changeTextProp("textAlign", e.target.value) } className="form-select form-select-sm mb-1" >
                      <option value="center">Center</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                )}
              {selectedLayer !== null &&
                layers[selectedLayer].type === "shape" && (
                  <div className="mt-3">
                    <h4 className="h6 fw-bold mb-2">Màu Shape</h4>
                    <input type="color" value={layers[selectedLayer].color} onChange={(e) => changeShapeColor(e.target.value)} className="form-control form-control-color" />
                  </div>
                )}
            </div>

            {/* Danh sách Layer */}
            <div className="card shadow p-4">
              <h3 className="h5 fw-bold mb-3 text-dark">Danh Sách Layer</h3>
              <ul className="list-group">
                {layers.map((layer, i) => (
                  <li key={i} className={`list-group-item d-flex align-items-center gap-2 ${ selectedLayer === i ? "active" : "" }`} onClick={() => setSelectedLayer(i)} >
                    <img src={getLayerThumbnail(layer)} width="30" height="30" alt="" />
                    <span className="flex-grow-1"> {layer.name || `${layer.type} ${i + 1}`} </span>
                    <button className="btn btn-sm btn-outline-secondary" onClick={(e) => { e.stopPropagation(); toggleLockSelected(); }} >
                      {layer.locked ? "Khóa" : "Mở"}
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); setSelectedLayer(i); deleteSelected(); }} >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-success bg-gradient rounded shadow p-4">
              <div className="d-grid gap-2">
                <button onClick={exportAvatar} className="btn btn-light text-success fw-bold py-2" > Export Avatar </button>
                <button onClick={clearAll} className="btn btn-danger"> Xóa Tất Cả </button>
              </div>
            </div>

            <div className="alert alert-primary small">
              <h4 className="h6 fw-bold mb-2">Hướng dẫn:</h4>
              <ul className="mb-0 ps-3">
                <li>Upload ảnh → Click chọn → Kéo để di chuyển</li>
                <li>Kéo góc vuông xanh để resize (giữ tỉ lệ)</li>
                <li>Dùng Lên/Xuống để sắp xếp layer</li>
                <li>Export để tải về</li>
              </ul>
            </div>
          </div>

          <div className="fixed col-12 col-lg-8">
            <div className="card shadow p-4">
              <div className="d-flex justify-content-center">
                <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchMove={handleTouchMove} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="border rounded shadow" style={{ maxWidth: "100%", height: "auto", borderWidth: "4px", borderColor: "#dee2e6", cursor: "default", touchAction: "none"}} />
              </div>
              {selectedLayer !== null && (
                <div className="mt-3 text-center small text-primary fw-semibold">
                  Đã chọn layer {selectedLayer + 1}/{layers.length}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
