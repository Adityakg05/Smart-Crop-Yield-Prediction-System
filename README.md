# 🌱 Smart Crop Yield Prediction System

A machine learning-based simple system for predicting agricultural crop yields using environmental and soil parameters. This project demonstrates a complete ML pipeline with fair data preprocessing, balanced training, and realistic evaluation.

## 🎯 Features

- **Advanced ML Pipeline**: Proper data cleaning, train-test split, balanced sampling, and realistic evaluation
- **Random Forest Model**: Robust ensemble learning with 100 trees
- **Fair Training**: Balanced sampling on training data grouped by state (only applied to training, not test)
- **FastAPI Backend**: RESTful API for predictions with built-in documentation
- **Modern Frontend**: Responsive web interface for easy predictions
- **Comprehensive Preprocessing**: Handles missing values, duplicates, and categorical encoding

## 📊 ML Pipeline Architecture

```
1. Data Cleaning
   ├─ Remove duplicates
   ├─ Handle missing values
   └─ Select relevant features

2. Train-Test Split (80-20)
   ├─ Training: 80%
   └─ Testing: 20% (UNBALANCED for realistic evaluation)

3. Balanced Sampling (TRAINING ONLY)
   ├─ Group training data by state
   ├─ Find minimum samples across states
   └─ Sample equal rows from each state

4. Model Training
   └─ RandomForestRegressor (n_estimators=100)

5. Evaluation (UNBALANCED TEST DATA)
   ├─ RMSE: Root Mean Squared Error
   └─ R²: Coefficient of Determination
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- pip or conda

### Installation

1. **Navigate to the project directory**:
```bash
cd "Crop Yield Prediction System"
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Prepare the dataset**:
   - Place `dataset.csv` in the `data/` folder
   - Dataset should contain agricultural yield data with state information

### Running the System

#### Start the Backend API

From the `backend/` directory:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at: `http://127.0.0.1:8000`

#### Access the Frontend

Open `frontend/index.html` in your web browser or serve it with a local server:
```bash
# Using Python 3
python -m http.server 5500 --directory frontend

# Then open: http://127.0.0.1:5500
```

## 📁 Project Structure

```
crop-yield-prediction/
│
├── backend/
│   ├── main.py              # FastAPI app (routes)
│   ├── model.py             # ML training + prediction logic
│   ├── preprocessing.py     # Data cleaning + feature engineering
│   └── utils.py             # Helper functions
│
├── frontend/
│   ├── index.html           # UI structure
│   ├── style.css            # Styling
│   └── script.js            # API calls + logic
│
├── data/
│   └── dataset.csv          # Raw agricultural dataset
│
├── models/
│   └── (future) trained_model.pkl
│
├── requirements.txt
├── README.md
└── .gitignore
```

## 🔌 API Endpoints

### POST `/predict`
**Predict crop yield based on input parameters**

**Request Body**:
```json
{
  "rainfall": 200.5,
  "temperature": 25.4,
  "humidity": 65.2,
  "N": 80.5,
  "P": 40.2,
  "K": 35.1,
  "area": 100,
  "state": "Punjab",
  "crop": "Rice"
}
```

**Response**:
```json
{
  "predicted_yield": 2150.75
}
```

### GET `/metrics`
**Get model performance metrics**

**Response**:
```json
{
  "rmse": 156.23,
  "r2_score": 0.8234
}
```

### GET `/`
**Welcome message**

## 🧠 Model Details

- **Algorithm**: Random Forest Regressor
- **Trees**: 100
- **Features**: 7 numerical + 2 categorical
- **Scaling**: StandardScaler for numerical features
- **Encoding**: OneHotEncoder for categorical features

### Input Features

**Numerical**:
- Rainfall (mm)
- Temperature (°C)
- Humidity (%)
- Nitrogen (N)
- Phosphorus (P)
- Potassium (K)
- Area (hectares)

**Categorical**:
- State (Indian state)
- Crop (type of crop)

## 📈 Data Processing

1. **Raw Data**: Extracted from agricultural database with crop-specific yields
2. **Preprocessing**: 
   - Extracted yield data from crop-specific columns
   - Created synthetic environmental features based on yield patterns
   - Removed duplicates and invalid records
   - Applied scaling and encoding

3. **Train-Test Split**: 80% training, 20% testing
4. **Balanced Sampling**: Applied to training data only
   - Groups by state
   - Samples equal rows from each state
   - Ensures fair representation during training

5. **Evaluation**: Performed on original unbalanced test data for realistic metrics

## ⚖️ Fair ML Practices

✅ **Balanced Training**
- Prevents state bias during model training
- Equal representation across geographic regions

✅ **Unbiased Testing**
- Test set NOT balanced
- Reflects real-world imbalanced data distribution
- Realistic performance metrics

✅ **Proper Preprocessing**
- Separate preprocessing for train and test
- No data leakage between datasets

## 📊 Example Prediction

Input parameters:
- Rainfall: 250 mm
- Temperature: 26°C
- Humidity: 60%
- N: 100 kg
- P: 50 kg
- K: 40 kg
- Area: 10 hectares
- State: Punjab
- Crop: Wheat

Expected Output:
- Predicted Yield: ~2200-2400 kg/hectare

## 🔧 Technologies Used

**Backend**:
- FastAPI: Modern web framework
- scikit-learn: ML algorithms
- pandas: Data manipulation
- numpy: Numerical computing

**Frontend**:
- HTML5: Structure
- CSS3: Styling
- JavaScript: Interactivity

## 📝 Model Performance

The model is evaluated on unbalanced test data to ensure realistic performance metrics:
- RMSE (Root Mean Squared Error): Measures prediction error magnitude
- R² Score: Proportion of variance explained by the model

## 🐛 Troubleshooting

**Cannot connect to server**:
- Ensure backend is running: `python -m uvicorn main:app --host 0.0.0.0 --port 8000`
- Check if port 8000 is available

**Dataset issues**:
- Verify `dataset.csv` exists in `data/` folder
- Check CSV format and column names
- The system falls back to dummy data if dataset is invalid

**Port already in use**:
```bash
# Use different port
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

## 📚 References

- [scikit-learn Documentation](https://scikit-learn.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [pandas Documentation](https://pandas.pydata.org/)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

**Last Updated**: April 2026
**Version**: 1.0.0
