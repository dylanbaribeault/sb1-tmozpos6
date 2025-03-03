import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { VictoryChart, VictoryBar, VictoryTheme, VictoryAxis } from 'victory-native';
import { theme } from '../theme';

interface DataPoint {
  date: string;
  count: number;
}

interface DeviceChartProps {
  data: DataPoint[];
}

const DeviceChart: React.FC<DeviceChartProps> = ({ data }) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={20}
        width={Dimensions.get('window').width - 64}
        height={250}
      >
        <VictoryAxis
          tickFormat={(date) => formatDate(date)}
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(count) => count}
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryBar
          data={data}
          x="date"
          y="count"
          style={{
            data: {
              fill: theme.colors.primary,
              width: 20,
            },
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 500 },
          }}
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DeviceChart;