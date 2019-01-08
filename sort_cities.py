import pandas as pd

data = pd.read_csv('weatherAUS.csv', sep=',',header=0)
territ = pd.read_csv('Cities.csv',sep=',',header=0)

data_t = pd.merge(data,territ,left_on='Location',right_on='Station')

data_t['Date']

data_t['date_months'] = data_t['Date'].str[:7]

#On garde ce qui est utile à garder

data_f = data_t[['Location', 'MinTemp', 'MaxTemp', 'Rainfall', 'WindGustDir',
     'WindGustSpeed','WindSpeed9am', 'WindSpeed3pm', 'Humidity9am', 'Humidity3pm',
       'Pressure9am', 'Pressure3pm', 'Temp9am','Temp3pm', 'State', 'date_months']]

data_f = data_f.fillna(0)


#Aggréger selon station et mois
data_agg = data_f.groupby(['State','date_months'],as_index=False).mean()
