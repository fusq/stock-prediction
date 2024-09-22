import numpy as np
import datetime
import sys
import json

def tcopil(serie, time=None, horizon=1, output='TcopilValues', extra_params=None):
    """
    Function to generate the predictions of a time series using the TCOPIL method.
    Parameters
    ----------
    serie : numpy array or list (int, float, or double)
        Time series to be forecasted.
    time : list of date time (format: "YYYY-MM-DD HH:MM:SS") in UTC (default = None)
        Time stamps of the time series.
    horizon : int (default = 1)
        Number of steps ahead to forecast.
    output : str
        Output category to forecast : list
            'TcopilTendency' for the tendency of the forecasted time series -> output will be [+1] or [-1]
            'TcopilValues' for the values of the forcasted time series -> output will be the values of the time series: a list of size horizon
    extra_params : dict (default = None)
        Extra parameters: TBD if needed.
    We assume the period of the time series is constant. Horizon is the number of steps ahead to forecast.
    """
    if time is not None:
        assert len(serie) == len(time), 'The length of the time series and the time stamps should be the same.'
        # check if the time series format is correct
        assert all(isinstance(x, datetime.datetime) for x in time), 'The time series should be in datetime format.'

    if output == 'TcopilTendency':
        return [1 if serie[-1] < np.mean(serie[-5:]) else -1]
    if output == 'TcopilValues':
        # More varied prediction using exponential moving average and random walk
        alpha = 0.3
        last_value = serie[-1]
        ema = np.mean(serie[-5:])
        predictions = []
        for _ in range(horizon):
            ema = alpha * last_value + (1 - alpha) * ema
            random_walk = np.random.normal(0, np.std(serie) * 0.1)
            new_value = ema + random_walk
            predictions.append(round(new_value, 2))
            last_value = new_value
        return predictions

def main():
    # Read input from stdin
    input_data = sys.stdin.read()
    serie = json.loads(input_data)

    # Convert to numpy array
    serie = np.array(serie)

    horizon = 10
    # for tendency:
    output = 'TcopilTendency'
    tendency = tcopil(serie, horizon=horizon, output=output)
    
    # for values:
    output = 'TcopilValues'
    values = tcopil(serie, horizon=horizon, output=output)

    # Prepare the result
    result = {
        'tendency': tendency,
        'values': values
    }

    # Print the result as JSON
    print(json.dumps(result))

if __name__ == "__main__":
    main()