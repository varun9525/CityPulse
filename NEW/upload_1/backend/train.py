import argparse
from pathlib import Path

from ultralytics import YOLO


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train a CityPulse YOLO model.")
    parser.add_argument(
        "--data",
        default="dataset/citypulse/data.yaml",
        help="Path to data.yaml.",
    )
    parser.add_argument(
        "--model",
        default="yolov8n.pt",
        help="Base model or checkpoint to fine-tune.",
    )
    parser.add_argument("--epochs", type=int, default=50, help="Number of epochs.")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size.")
    parser.add_argument("--batch", type=int, default=16, help="Batch size.")
    parser.add_argument(
        "--device",
        default="",
        help="Device to use (e.g. '0' for GPU, 'cpu' for CPU).",
    )
    parser.add_argument(
        "--project",
        default="runs/train",
        help="Project directory for training runs.",
    )
    parser.add_argument(
        "--name",
        default="citypulse",
        help="Run name for outputs.",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        raise FileNotFoundError(f"Data file not found: {data_path}")

    model = YOLO(args.model)
    model.train(
        data=str(data_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        project=args.project,
        name=args.name,
    )
    model.val(data=str(data_path), imgsz=args.imgsz, device=args.device)


if __name__ == "__main__":
    main()
