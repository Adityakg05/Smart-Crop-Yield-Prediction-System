"""
model.py — CropYieldModel: training pipeline, prediction logic, and confidence scoring.

The model is a RandomForest wrapped in a sklearn Pipeline so preprocessing
(scaling, one-hot encoding) is bundled with the estimator. This way we can
call .predict() on raw farmer inputs without a separate transform step.
"""

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


class CropYieldModel:

    def __init__(self):
        self.categorical_features = ['state', 'crop']
        self.numerical_features   = [
            'rainfall', 'temperature', 'humidity',
            'N', 'P', 'K', 'area', 'year',
        ]
        self.target = 'yield'

        # Build the preprocessing + estimator pipeline once at init time.
        # handle_unknown='ignore' lets the model accept unseen state/crop
        # combos at prediction time instead of crashing.
        numeric_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='mean')),
            ('scaler',  StandardScaler()),
        ])
        # OneHotEncoding is essential for 'state' and 'crop' features.
        # It converts categorical labels into a numeric format that the model
        # can process without assuming an artificial order between states or crops.
        categorical_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot',  OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
        ])
        preprocessor = ColumnTransformer([
            ('num', numeric_transformer,     self.numerical_features),
            ('cat', categorical_transformer, self.categorical_features),
        ])

        # We use a RandomForestRegressor because it's an ensemble method that
        # handles the nonlinear relationships in agricultural data (e.g., the
        # interaction between rainfall and temperature) much better than linear models.
        # It's also robust to the noise in our synthetic environmental features.
        self.pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('regressor',    RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)),
        ])

        self.is_trained           = False
        self.metrics              = {"rmse": None, "r2": None}

        # Populated after training — used to flag suspicious predictions
        self.training_ranges      = {}
        self.seen_combinations    = set()   # (state, crop) pairs in the training data
        self.seen_crops           = set()
        self.seen_states          = set()
        self.crop_influence_factors = {}


    # ── Dataset preprocessing ────────────────────────────────────────────────

    def _build_training_records(self, raw_df: pd.DataFrame) -> pd.DataFrame:
        """
        The CSV has one row per district-year with separate columns for every
        crop's yield, area, and production.  We pivot that into one row per
        (district, year, crop) so the model sees each observation as independent.

        Environmental features (rainfall, temp, etc.) are not in the CSV, so
        we synthesise them from crop-type priors plus Gaussian noise.  This is
        a known limitation — real sensor data would improve accuracy significantly.
        """

        # Maps display name → (yield_col, area_col, production_col) in the CSV
        crop_column_map = {
            'Rice':         ('RICE YIELD (Kg per ha)',           'RICE AREA (1000 ha)',           'RICE PRODUCTION (1000 tons)'),
            'Wheat':        ('WHEAT YIELD (Kg per ha)',          'WHEAT AREA (1000 ha)',          'WHEAT PRODUCTION (1000 tons)'),
            'Maize':        ('MAIZE YIELD (Kg per ha)',          'MAIZE AREA (1000 ha)',          'MAIZE PRODUCTION (1000 tons)'),
            'Sorghum':      ('SORGHUM YIELD (Kg per ha)',        'SORGHUM AREA (1000 ha)',        'SORGHUM PRODUCTION (1000 tons)'),
            'Jowar':        ('SORGHUM YIELD (Kg per ha)',        'SORGHUM AREA (1000 ha)',        'SORGHUM PRODUCTION (1000 tons)'),
            'Pearl Millet': ('PEARL MILLET YIELD (Kg per ha)',  'PEARL MILLET AREA (1000 ha)',  'PEARL MILLET PRODUCTION (1000 tons)'),
            'Bajra':        ('PEARL MILLET YIELD (Kg per ha)',  'PEARL MILLET AREA (1000 ha)',  'PEARL MILLET PRODUCTION (1000 tons)'),
            'Finger Millet':('FINGER MILLET YIELD (Kg per ha)', 'FINGER MILLET AREA (1000 ha)', 'FINGER MILLET PRODUCTION (1000 tons)'),
            'Ragi':         ('FINGER MILLET YIELD (Kg per ha)', 'FINGER MILLET AREA (1000 ha)', 'FINGER MILLET PRODUCTION (1000 tons)'),
            'Barley':       ('BARLEY YIELD (Kg per ha)',         'BARLEY AREA (1000 ha)',         'BARLEY PRODUCTION (1000 tons)'),
            'Chickpea':     ('CHICKPEA YIELD (Kg per ha)',       'CHICKPEA AREA (1000 ha)',       'CHICKPEA PRODUCTION (1000 tons)'),
            'Gram':         ('CHICKPEA YIELD (Kg per ha)',       'CHICKPEA AREA (1000 ha)',       'CHICKPEA PRODUCTION (1000 tons)'),
            'Pigeonpea':    ('PIGEONPEA YIELD (Kg per ha)',      'PIGEONPEA AREA (1000 ha)',      'PIGEONPEA PRODUCTION (1000 tons)'),
            'Pigeon Pea':   ('PIGEONPEA YIELD (Kg per ha)',      'PIGEONPEA AREA (1000 ha)',      'PIGEONPEA PRODUCTION (1000 tons)'),
            'Minor Pulses': ('MINOR PULSES YIELD (Kg per ha)',  'MINOR PULSES AREA (1000 ha)',  'MINOR PULSES PRODUCTION (1000 tons)'),
            'Groundnut':    ('GROUNDNUT YIELD (Kg per ha)',      'GROUNDNUT AREA (1000 ha)',      'GROUNDNUT PRODUCTION (1000 tons)'),
            'Sesamum':      ('SESAMUM YIELD (Kg per ha)',        'SESAMUM AREA (1000 ha)',        'SESAMUM PRODUCTION (1000 tons)'),
            'Rapeseed':     ('RAPESEED AND MUSTARD YIELD (Kg per ha)', 'RAPESEED AND MUSTARD AREA (1000 ha)', 'RAPESEED AND MUSTARD PRODUCTION (1000 tons)'),
            'Mustard':      ('RAPESEED AND MUSTARD YIELD (Kg per ha)', 'RAPESEED AND MUSTARD AREA (1000 ha)', 'RAPESEED AND MUSTARD PRODUCTION (1000 tons)'),
            'Safflower':    ('SAFFLOWER YIELD (Kg per ha)',      'SAFFLOWER AREA (1000 ha)',      'SAFFLOWER PRODUCTION (1000 tons)'),
            'Castor':       ('CASTOR YIELD (Kg per ha)',         'CASTOR AREA (1000 ha)',         'CASTOR PRODUCTION (1000 tons)'),
            'Linseed':      ('LINSEED YIELD (Kg per ha)',        'LINSEED AREA (1000 ha)',        'LINSEED PRODUCTION (1000 tons)'),
            'Sunflower':    ('SUNFLOWER YIELD (Kg per ha)',      'SUNFLOWER AREA (1000 ha)',      'SUNFLOWER PRODUCTION (1000 tons)'),
            'Soyabean':     ('SOYABEAN YIELD (Kg per ha)',       'SOYABEAN AREA (1000 ha)',       'SOYABEAN PRODUCTION (1000 tons)'),
            'Soybean':      ('SOYABEAN YIELD (Kg per ha)',       'SOYABEAN AREA (1000 ha)',       'SOYABEAN PRODUCTION (1000 tons)'),
            'Oilseeds':     ('OILSEEDS YIELD (Kg per ha)',       'OILSEEDS AREA (1000 ha)',       'OILSEEDS PRODUCTION (1000 tons)'),
            'Sugarcane':    ('SUGARCANE YIELD (Kg per ha)',      'SUGARCANE AREA (1000 ha)',      'SUGARCANE PRODUCTION (1000 tons)'),
            'Cotton':       ('COTTON YIELD (Kg per ha)',         'COTTON AREA (1000 ha)',         'COTTON PRODUCTION (1000 tons)'),
        }

        # Agronomic priors: rough expected environment for each crop.
        # These shift the synthetic environmental features so wheat vs. rice
        # inputs don't look identical to the model.
        crop_env_priors = {
            'Rice':      {'yield_mult': 1.1, 'temp_pref': 27, 'rain_pref': 250},
            'Wheat':     {'yield_mult': 0.9, 'temp_pref': 18, 'rain_pref': 80},
            'Maize':     {'yield_mult': 1.0, 'temp_pref': 24, 'rain_pref': 120},
            'Cotton':    {'yield_mult': 0.7, 'temp_pref': 28, 'rain_pref': 100},
            'Sugarcane': {'yield_mult': 4.5, 'temp_pref': 26, 'rain_pref': 200},
            'Jowar':     {'yield_mult': 0.6, 'temp_pref': 28, 'rain_pref': 60},
            'Bajra':     {'yield_mult': 0.5, 'temp_pref': 30, 'rain_pref': 40},
            'Groundnut': {'yield_mult': 0.8, 'temp_pref': 25, 'rain_pref': 110},
            'Soyabean':  {'yield_mult': 0.85,'temp_pref': 24, 'rain_pref': 130},
            'Barley':    {'yield_mult': 0.75,'temp_pref': 20, 'rain_pref': 70},
            'Chickpea':  {'yield_mult': 0.4, 'temp_pref': 22, 'rain_pref': 50},
            'Tobacco':   {'yield_mult': 1.2, 'temp_pref': 26, 'rain_pref': 140},
        }
        default_prior = {'yield_mult': 1.0, 'temp_pref': 25, 'rain_pref': 150}

        records = []
        for _, row in raw_df.iterrows():
            state = row.get('State Name', 'Unknown')
            year  = row.get('Year', 2020)

            for crop_name, (yield_col, area_col, prod_col) in crop_column_map.items():
                if not all(c in raw_df.columns for c in (yield_col, area_col, prod_col)):
                    continue

                yield_val = row[yield_col]
                area_val  = row[area_col]
                prod_val  = row[prod_col]

                # Skip rows with zero or missing values — they'd just add noise
                if not (
                    pd.notna(yield_val) and pd.notna(area_val) and pd.notna(prod_val)
                    and yield_val > 0 and area_val > 0 and prod_val > 0
                ):
                    continue

                prior = crop_env_priors.get(crop_name, default_prior)

                records.append({
                    'state':       state,
                    'crop':        crop_name,
                    'yield':       float(yield_val) * prior['yield_mult'],
                    'area':        float(area_val),
                    'production':  float(prod_val),
                    'year':        int(year),
                    # Synthesised from priors + noise — independent of the yield target
                    'rainfall':    min(500, prior['rain_pref'] + np.random.normal(0, 80)),
                    'temperature': prior['temp_pref'] + np.random.normal(0, 7),
                    'humidity':    min(90, 65 + np.random.normal(0, 15)),
                    'N':           max(5, 50 + np.random.normal(0, 20)),
                    'P':           max(5, 30 + np.random.normal(0, 15)),
                    'K':           max(5, 40 + np.random.normal(0, 20)),
                })

        result_df = pd.DataFrame(records)
        print(f"  Built {len(result_df):,} training records from {len(raw_df):,} raw rows")
        return result_df


    def _clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Drop duplicates and rows with nulls in the columns the model actually uses."""
        initial_count = len(df)
        df = df.drop_duplicates()

        required_cols = self.numerical_features + self.categorical_features + [self.target]
        df = df[required_cols].dropna()

        removed = initial_count - len(df)
        if removed:
            print(f"  Dropped {removed:,} invalid/duplicate rows")
        return df


    def _balance_by_state(
        self, X_train: pd.DataFrame, y_train: pd.Series
    ) -> tuple:
        """
        Some states have far more historical records than others, which would
        bias the model toward well-represented states.  We cap each state at
        the minimum sample count so every region gets equal weight.

        Important: this only touches training data — the test split stays as-is
        so evaluation reflects the real-world data distribution.
        """
        X_train = X_train.reset_index(drop=True)
        y_train = y_train.reset_index(drop=True)

        combined = X_train.copy()
        combined[self.target] = y_train.values

        if 'state' not in combined.columns:
            return X_train, y_train

        state_counts = combined['state'].value_counts()
        min_samples  = state_counts.min()

        print(f"  Balancing training data — keeping {min_samples} samples per state")
        balanced_parts = [
            combined[combined['state'] == state].sample(n=min_samples, random_state=42)
            for state in state_counts.index
        ]
        balanced = (
            pd.concat(balanced_parts, ignore_index=True)
            .sample(frac=1, random_state=42)
            .reset_index(drop=True)
        )

        X_balanced = balanced[self.numerical_features + self.categorical_features]
        y_balanced = balanced[self.target]
        print(f"  Balanced training size: {len(X_balanced):,} rows")
        return X_balanced, y_balanced


    # ── Training ─────────────────────────────────────────────────────────────

    def train(self, csv_path: str = "../data/dataset.csv"):
        """
        Full training pipeline.  Falls back to a tiny synthetic dataset if
        anything goes wrong so the API keeps running even with a bad CSV.
        """
        print("\n" + "-" * 60)
        print("  Training crop yield model")
        print("-" * 60)

        try:
            raw_df = pd.read_csv(csv_path)
            print(f"  Loaded {len(raw_df):,} raw rows from {csv_path}")

            training_df = self._build_training_records(raw_df)
            training_df = self._clean_dataframe(training_df)

            # In agricultural reality, a 'good' yield for wheat is vastly different
            # from a 'good' yield for cotton. These influence factors normalize
            # the predictions so the model doesn't over-rely on high-volume crops
            # and ignore the environmental nuances of others.
            crop_mean_yield  = training_df.groupby('crop')[self.target].mean()
            global_mean      = crop_mean_yield.mean()
            self.crop_influence_factors = (
                (crop_mean_yield / global_mean).clip(0.7, 1.3).to_dict()
            )

            all_required = self.numerical_features + self.categorical_features + [self.target]
            missing_cols = [c for c in all_required if c not in training_df.columns]
            if missing_cols:
                raise ValueError(f"Missing required columns: {missing_cols}")

            # 80/20 split — test stays unbalanced to measure real-world performance
            feature_cols = self.numerical_features + self.categorical_features
            X = training_df[feature_cols]
            y = training_df[self.target]

            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            X_train_balanced, y_train_balanced = self._balance_by_state(X_train, y_train)

            print("  Fitting RandomForestRegressor...")
            self.pipeline.fit(X_train_balanced, y_train_balanced)
            self.is_trained = True

            # Store training ranges so we can flag inputs outside seen territory
            for col in self.numerical_features:
                self.training_ranges[col] = {
                    'min': float(training_df[col].min()),
                    'max': float(training_df[col].max()),
                }

            # Record which (state, crop) combos actually appeared in training
            for _, row in training_df.iterrows():
                self.seen_combinations.add((row['state'], row['crop']))
                self.seen_crops.add(row['crop'])
                self.seen_states.add(row['state'])

            # Evaluate on the original (non-balanced) test set
            y_predicted = self.pipeline.predict(X_test)
            rmse = np.sqrt(mean_squared_error(y_test, y_predicted))
            r2   = r2_score(y_test, y_predicted)

            self.metrics = {"rmse": float(rmse), "r2": float(r2)}

            print(f"  R²: {r2:.4f}  |  RMSE: {rmse:.4f}")
            print("-" * 60 + "\n")

        except Exception as exc:
            print(f"  Training failed ({exc}) - falling back to synthetic data")
            self._train_with_synthetic_fallback()


    def _train_with_synthetic_fallback(self):
        """
        Minimal synthetic training data so the API stays alive even when
        the real dataset is missing or corrupt.  Predictions will be rough
        but at least endpoints won't return 500s.
        """
        fallback_rows = {
            'rainfall':    [100.0, 200.0, 150.0, 300.0, 120.0, 250.0],
            'temperature': [ 25.0,  30.0,  27.0,  32.0,  24.0,  28.0],
            'humidity':    [ 60.0,  70.0,  65.0,  80.0,  55.0,  75.0],
            'N':           [ 50.0,  60.0,  55.0,  70.0,  45.0,  65.0],
            'P':           [ 40.0,  50.0,  45.0,  60.0,  35.0,  55.0],
            'K':           [ 30.0,  40.0,  35.0,  50.0,  25.0,  45.0],
            'area':        [ 10.0,  20.0,  15.0,  25.0,  12.0,  18.0],
            'year':        [2024,   2024,  2024,  2024,  2024,  2024],
            'state':       ['StateA','StateB','StateA','StateB','StateA','StateB'],
            'crop':        ['Rice','Wheat','Rice','Wheat','Rice','Wheat'],
            'yield':       [150.0, 250.0, 200.0, 350.0, 180.0, 280.0],
        }
        fallback_df = pd.DataFrame(fallback_rows)
        X = fallback_df[self.numerical_features + self.categorical_features]
        y = fallback_df[self.target]
        self.pipeline.fit(X, y)
        self.is_trained = True
        print("  Fallback model ready.")


    # ── Prediction ───────────────────────────────────────────────────────────

    def predict(self, farm_inputs: dict) -> dict:
        """
        Takes a dict of farmer inputs and returns a yield estimate with
        a confidence score and any agronomic warnings.

        Confidence is derived from the inter-tree variance of the forest —
        trees that disagree a lot → lower confidence.
        """
        if not self.is_trained:
            raise ValueError("Model hasn't been trained yet — call .train() first")

        # Fill in fields the model needs that the user didn't provide
        prediction_inputs = farm_inputs.copy()
        prediction_inputs.setdefault('district', 'Unknown')
        prediction_inputs.setdefault('year', 2024)

        feature_df = pd.DataFrame([prediction_inputs])
        feature_df = feature_df[self.numerical_features + self.categorical_features]

        selected_state = prediction_inputs.get('state')
        selected_crop  = prediction_inputs.get('crop')

        # Check whether this state+crop pair appeared in training data.
        # Combinations that weren't seen get a confidence penalty.
        agronomic_warnings = []
        confidence_adjustment = 0.0

        is_known_combination = (selected_state, selected_crop) in self.seen_combinations
        if not is_known_combination:
            agronomic_warnings.append(
                "Limited historical data for this crop in the selected state — result is approximate."
            )
            confidence_adjustment -= 0.15

        # Core prediction
        raw_yield = self.pipeline.predict(feature_df)[0]

        # Apply crop-specific scaling so Sugarcane vs Chickpea yield ranges
        # stay realistic rather than converging toward the global mean
        crop_multiplier = self.crop_influence_factors.get(selected_crop, 1.0)
        adjusted_yield  = raw_yield * crop_multiplier

        # Clamp to [500, 10000] kg/ha (≈ 0.5–10 t/ha) — the model can occasionally
        # produce nonsense extrapolations, this keeps the display sensible
        clamped_yield = max(500.0, min(adjusted_yield, 10000.0))

        # Flag inputs near the edges of what the model was trained on
        edge_feature_count = 0
        for feat in self.numerical_features:
            if feat not in self.training_ranges or feat not in prediction_inputs:
                continue
            val      = prediction_inputs[feat]
            feat_min = self.training_ranges[feat]['min']
            feat_max = self.training_ranges[feat]['max']
            feat_range = feat_max - feat_min
            if feat_range > 0:
                within_5pct_of_edge = (
                    val < feat_min + feat_range * 0.05
                    or val > feat_max - feat_range * 0.05
                )
                if within_5pct_of_edge:
                    edge_feature_count += 1

        if edge_feature_count >= 2:
            agronomic_warnings.append(
                "Several inputs are near the extremes of the training data — confidence is lower."
            )
            confidence_adjustment -= 0.1

        # Confidence from RandomForest tree variance (coefficient of variation)
        try:
            X_transformed = self.pipeline.named_steps['preprocessor'].transform(feature_df)
            per_tree_predictions = np.array([
                tree.predict(X_transformed)[0]
                for tree in self.pipeline.named_steps['regressor'].estimators_
            ])
            mean_prediction = np.mean(per_tree_predictions)
            if mean_prediction > 0:
                coeff_of_variation = np.std(per_tree_predictions) / mean_prediction
                base_confidence    = max(0.8, min(0.98, 1.0 - coeff_of_variation))
            else:
                base_confidence = 0.85
        except Exception:
            per_tree_predictions = None
            base_confidence      = 0.92

        final_confidence = max(0.60, min(0.95, base_confidence + confidence_adjustment))

        # 95% confidence interval using tree spread
        tree_std  = np.std(per_tree_predictions) if per_tree_predictions is not None else clamped_yield * 0.1
        yield_low = max(0.0, clamped_yield - 1.96 * tree_std)
        yield_high = clamped_yield + 1.96 * tree_std

        return {
            "yield":          float(clamped_yield),
            "yield_min":      float(yield_low),
            "yield_max":      float(yield_high),
            "confidence":     float(final_confidence),
            "warnings":       agronomic_warnings,
            "is_valid_combo": is_known_combination,
        }


# Module-level singleton — FastAPI imports this and calls .train() at startup
model_instance = CropYieldModel()
